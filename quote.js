// use the express middleware
var express = require('express'),
    pg = require('pg').native,
    connectionString = 'postgres://ecnbtqsyugvdxf:dxUfMx9EGB1n35Wrw30aplM7ml@ec2-107-20-152-139.compute-1.amazonaws.com:5432/d5ocpahj31f72f',
    port = process.env.PORT,
    client,
    password = require('password-hash-and-salt'),
    jwt = require('jwt-simple'),
    moment = require('moment');

// make express handle JSON and other requests
var bodyParser = require('body-parser');
// use cross origin resource sharing
var cors = require('cors');
// instantiate app
var app = express();
// make sure we can parse JSON
app.use(bodyParser.json());
// serve up files from this directory 
app.use(express.static(__dirname));
// make sure we use CORS to avoid cross domain problems
app.use(cors());
app.set('jwtTokenSecret', 'az*975JXkJ^#BEh@X@V4V^5Qr');
client = new pg.Client(connectionString);
client.connect();

//A function to validate a token from a request
var validateToken = function(req, res, next) {
    if(!req.body.hasOwnProperty('access_token')) {
        return res.send('Error 403: You are missing an access token. Log in again to get one', 403);
    }
    
    var decoded = jwt.decode(req.body.access_token, app.get('jwtTokenSecret')); //Decode the token
    
    if(decoded.exp <= Date.now()) {
        return res.end('Error 403: Access token has expired', 403);
    }
    
    //Check the user exists
    var userExistQuery = client.query("SELECT * FROM users WHERE user_name = $1", [decoded.user]);
    
    userExistQuery.on('end', function(result) {
        if(result.rows[0].length < 1) {
            return res.send('Error 404: User for this token does not exist', 404);
        } else {                       
            //Check the provided token is the same as the stored one.
            if(result.rows[0].access_token === req.body.access_token) {
                //Do not need to check the expiry date of the stored token because it should be the same as the provided one. If not authentication will fail.
                next(); //Everything is ok with access token so run request
            } else {
                return res.end('Error 403: The provided token is inccorect. Try login again', 403);
            }  
        }
    });
    
    userExistQuery.on('error', function(error) {
       console.log('Error: ' + error);
       res.send('Error 500: An internal server error has occured', 500);
    });
}

app.post('/api/*', validateToken);

app.post('auth/login', function(req, res) {
    if(!req.body.hasOwnProperty('user') || !req.body.hasOwnProperty('password')) {
        res.statusCode = 400;
        return res.send('Error 400: Post syntax incorrect.');
    } else if(req.body.password === '') {
        //Should not allow a user password that is empty
        res.statusCode = 400;
        return res.send('Error 400: Password is empty.');
    } else if(req.body.user === '') {
        //Should not allow a user name that is empty
        res.statusCode = 400;
        return res.send('Error 400: Username is empty.');
    }
    var user = [];
    var hash = password(req.body.password).hash(function(error, hash) {
        if(error) {
            res.statusCode = 500;
            return res.send('Error 500: An internal servor error has occured.');
        }
        user.hash = hash;
        client.connect();
        
        var query = client.query('SELECT password FROM users WHERE user_name = $1', [req.body.user]);
        
        query.on('end', function(result) {
            if(result.rows.length === 1) {
                
                //Check the hashed password against the provided password
                password(req.body.password).verifyAgainst(result.rows[0].password, function(error, verified) {
                    if(error) {
                        res.statusCode = 500;
                        return res.send('Error 500: An internal servor error has occured.');
                    }
                    
                    if(!verified) {
                        res.statusCode = 401;
                        res.send('Error 401: Login failed');
                    } else {    //User name and password are valid
                        var expires = moment().add(5, 'days').valueOf(); //This is how long the token should be valid for
                        var token = jwt.encode({
                            user: req.body.user,
                            exp: expires
                        }, app.get('jwtTokenSecret'));
                        
                        //Store token in database so we can log the user out at a future date
                        var storeTokenQuery = client.query('INSERT INTO users (access_token) VALUES($1) WHERE user_name = $2', [req.body.user, token]);
                        
                        storeTokenQuery.on('end', function(result) {
                            //Everything is ok so send access token to user
                            res.json({
                                token: token,
                                expires: expires,
                                user: req.body.user
                            }); 
                        });
                        
                        //Handle storeTokenQuery query error
                        handleError(storeTokenQuery, client, res);
                    }
                });
            } else {
                //If we can not find the user then login failed
                res.statusCode = 404;
                res.send('Error 404: User not found');
            }
        });
    });
});

app.post('auth/logout', [validateToken], function(req, res) {
    var oldTokenVersion = tokenVersion;
    tokenVersion = Math.random();
    
    //Make sure the new token version is different
    while(oldTokenVersion !== tokenVersion) {
        tokenVersion = Math.random();
    }
    
    res.send('Successfully logged out', 200);
});

//Get all quotes from the database
app.get('/api/quote/all', function(req, res) {
    client.connect();
    var query = client.query('SELECT * FROM quotes');
    query.on('end', function(result) {
        if(result.rows.length <= 0) {
            res.statusCode = 404;
            return res.send('Error 404: No quotes avaliable to get');
        }
        res.send(result.rows);
    });
    handleError(query, client, res);
});
//Get a random quote from the database.
app.get('/api/quote/random', function(req, res) {
    client.connect();
    var query = client.query('SELECT * FROM quotes');
    query.on('end', function(result) {
        if(result.rows.length <= 0) {
            res.statusCode = 404;
            return res.send('Error 404: No quotes avaliable to get');
        }
        var rand = Math.floor(Math.random() * result.rows.length);
        res.send(result.rows[rand]);
    });
    handleError(query, client, res);
});
//Get a quote from the database based on the id passed
app.get('/api/quote/:id', function(req, res) {
    if(sanitize(req.params, res)) {
        return;
    }
    client.connect();
    var query = client.query('SELECT * FROM quotes WHERE quote_id = $1', [req.params.id]);
    query.on('end', function(result) {
        if(result.rows.length <= 0) {
            res.statusCode = 404;
            return res.send('Error 404: No quote found');
        }
        res.send(result.rows[0]);
    });
    handleError(query, client, res);
});
//Create a new quote in the database
app.post('/api/quote', function(req, res) {
    
    //Check that the required data was submitted
    if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
        res.statusCode = 400;
        return res.send('Error 400: Post syntax incorrect.');
    } else if(req.body.text === '') {
        //We understand the request and what they are trying to do but we will not try and process it because it is in the wrong format
        res.statusCode = 422;
        return res.send("Error 422: Quote text is required");
    }
    
    //First check that the author does not already have a quote saved
    client.connect();
    var query = client.query('SELECT COUNT(*) AS count FROM quotes WHERE author = $1', [req.body.author]);
    handleError(query, client, res);
    query.on('end', function(result) {
        if(result.rows[0].count > 0) {
            res.statusCode = 409;
            return res.send('Error 409: The author already has a quote')
        }
        client.connect();
        var query = client.query('SELECT MAX(quote_id) FROM quotes');
        handleError(query, client, res);
        query.on('end', function(result) {
            //Create the new id based on the highest id from database
            var id = (+result.rows[0].max) + 1;
            client.connect();
            var insertQuery = client.query('INSERT INTO quotes(quote_id, author, text) VALUES($1, $2, $3)', [id, req.body.author, req.body.text]);
            insertQuery.on('end', function(result) {
                client.end();
                res.statusCode = 201;
                res.send('Created a new quote with id ' + id);
            });
            handleError(insertQuery, client, res);
        });
    })
});
//Delete a quote from the database
app.delete('/api/quote/:id', function(req, res) {
    if(sanitize(req.params, res)) {
        return;
    }
    client.connect();
    var query = client.query('DELETE FROM quotes WHERE quote_id = $1', [req.params.id]);
    query.on('end', function(result) {
        client.end();
        res.statusCode = 204;
        res.json(true);
    });
    handleError(query, client, res);
});
// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});

/**
 * Handle a postgressql query error
 */
function handleError(errQuery, errClient, res) {
    errQuery.on('error', function(error) {
        errClient.end();
        console.log("Error 500: " + JSON.stringify(error));
        //Throw 500 but do not return error message to user as they will then find out the internal workings of the server
        res.statusCode = 500;
        res.send('Error 500: An internal server error has occured');
    });
}

/*
 * General checks on the id param.
 *
 * Will throw error and send response
 *
 * @params - This is the object that should have the 'id' field. i.e req.params or req.body
 */
function sanitize(params, res, dbClient) {
    if(!params.hasOwnProperty('id')) {
        client.end();
        res.statusCode = 400;
        return res.send('Error 400: Post syntax incorrect.');
    } else if(params.id < 0) {
        client.end();
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
    } else if(isNaN(+params.id)) {
        client.end();
        //We understand the request and what they are trying to do but we will not try and process it because it is in the wrong format
        res.statusCode = 422;
        return res.send("Error 422: id must be of type number");
    }
    return false;
}