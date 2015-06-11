/**
 * John Armstrong
 * 300258117
 */

// use the express middleware
var express = require('express'),
    pg = require('pg').native,
    connectionString = process.env.DATABASE_URL,
    port = process.env.PORT,
    client;

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
client = new pg.Client(connectionString);
client.connect();

//Get all quotes from the database
app.get('/quote/all', function (req, res) {
    client.connect();
    var query = client.query('SELECT * FROM quotes');

    query.on('end', function (result) {
        if (result.rows.length <= 0) {
            res.statusCode = 404;
            return res.send('Error 404: No quotes available to get');
        }
        res.send(result.rows);
    });

    handleError(query, client, res);
});

//Get a random quote from the database.
app.get('/quote/random', function (req, res) {
    client.connect();
    var query = client.query('SELECT * FROM quotes');

    query.on('end', function (result) {
        if (result.rows.length <= 0) {
            res.statusCode = 404;
            return res.send('Error 404: No quotes available to get');
        }

        //Get a random number that will be an in the array index of quotes.
        var rand = Math.floor(Math.random() * result.rows.length);
        res.send(result.rows[rand]);
    });

    handleError(query, client, res);
});

//Get a quote from the database based on the id passed
app.get('/quote/:id', function (req, res) {
    if (sanitize(req.params, res)) {
        return;
    }

    client.connect();
    var query = client.query('SELECT * FROM quotes WHERE quote_id = $1', [req.params.id]);

    query.on('end', function (result) {
        if (result.rows.length <= 0) {
            res.statusCode = 404;
            return res.send('Error 404: No quote found');
        }
        res.send(result.rows[0]);
    });

    handleError(query, client, res);
});

//Create a new quote in the database
app.post('/quote', function (req, res) {

    //Check that the required data was submitted
    if (!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
        res.statusCode = 400;
        return res.send('Error 400: Post syntax incorrect.');
    } else if (req.body.text === '') {
        //We understand the request and what they are trying to do but we will not try and process it because it is in the wrong format
        res.statusCode = 422;
        return res.send("Error 422: Quote text is required");
    }

    //First check that the author does not already have a quote saved
    client.connect();
    var query = client.query('SELECT COUNT(*) AS count FROM quotes WHERE author = $1', [req.body.author]);

    handleError(query, client, res);

    query.on('end', function (result) {
        if (result.rows[0].count > 0) {
            res.statusCode = 409;
            return res.send('Error 409: The author already has a quote')
        }

        client.connect();
        var query = client.query('SELECT MAX(quote_id) FROM quotes');

        handleError(query, client, res);

        query.on('end', function (result) {
            //Create the new id based on the highest id from database plus one
            var id = (+result.rows[0].max) + 1;

            client.connect();
            var insertQuery = client.query('INSERT INTO quotes(quote_id, author, text) VALUES($1, $2, $3)', [id, req.body.author, req.body.text]);

            insertQuery.on('end', function (result) {
                client.end();
                res.statusCode = 201;
                res.send('Created a new quote with id ' + id);
            });

            handleError(insertQuery, client, res);
        });
    })


});

//Delete a quote from the database
app.delete('/quote/:id', function (req, res) {
    if (sanitize(req.params, res)) {
        return;
    }

    client.connect();
    var query = client.query('DELETE FROM quotes WHERE quote_id = $1', [req.params.id]);

    query.on('end', function (result) {
        client.end();
        res.statusCode = 204;
        res.json(true);
    });

    handleError(query, client, res);
});

// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function () {
    console.log('Listening on port %d', server.address().port);
});

/**
 * Handle a postgressql query error. All error from querys are considered 500 errors.
 * This is because we do not know what the error may be and should not send the
 */
function handleError(errQuery, errClient, res) {
    errQuery.on('error', function (error) {
        errClient.end();
        console.log('Unknown Error: ' + JSON.stringify(error));
        res.statusCode = 500;
        res.send('Error 500: An unknown internal server error has occurred');
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
    if (!params.hasOwnProperty('id')) {
        client.end();
        res.statusCode = 400;
        return res.send('Error 400: Post syntax incorrect.');
    } else if (params.id < 0) {
        client.end();
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
    } else if (isNaN(+params.id)) {
        client.end();

        //We understand the request and what they are trying to do but we will not try and process it because it is in the wrong format
        res.statusCode = 422;
        return res.send("Error 422: id must be of type number");
    }
    return false;
}