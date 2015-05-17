// use the express middleware
var express = require('express'),
    pg = require('pg').native,
    connectionString = 'postgres://ecnbtqsyugvdxf:dxUfMx9EGB1n35Wrw30aplM7ml@ec2-107-20-152-139.compute-1.amazonaws.com:5432/d5ocpahj31f72f',
    start = new Date(),
    port = process.env.PORT,
    client;

console.log('Connection url: ' + connectionString);

// make express handle JSON and other requests
var bodyParser = require('body-parser');

// use cross origin resource sharing
var cors = require('cors');

// instantiate app
var app = express();

client = new pg.Client(connectionString);
client.connect();

// make sure we can parse JSON
app.use(bodyParser.json());

// serve up files from this directory 
app.use(express.static(__dirname));
// make sure we use CORS to avoid cross domain problems
app.use(cors());

app.get('/quote/random', function(req, res) {
  var id = Math.floor(Math.random() * quotes.length);
  var q = quotes[id];
  res.send(q);
});

app.get('/quote/:id', function(req, res) {

    if(!req.params.hasOwnProperty('id')) {
        res.statusCode = 400;
        return res.send('Error 400: Post syntax incorrect.');
    } else if(req.id < 0) {
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
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
    
    query.on('error', function(error) {
            client.end();
            //No idea what happened so return 500
            res.statusCode = 500;
            res.send('Error: ' + JSON.stringify(error));
        });
});

app.post('/quote', function(req, res) {
  console.log(req.body);
  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }    
    client.connect();
    var query = client.query('SELECT MAX(quote_id) FROM quotes');

    query.on('error', function(error) {
        client.end();
        res.statusCode = 500;
        res.send('Error: ' + error);
    });

    query.on('end', function (result) {
        console.log(JSON.stringify(result));
        //Create the new id based on the highest id from database
        var id = (+result.rows[0].max) + 1;
        
        client.connect();
        
        var query2 = client.query('INSERT INTO quotes(quote_id, author, text) VALUES($1, $2, $3)', [id, req.body.author, req.body.text]);
        
        query2.on('end', function(result) {
            client.end();
            res.send('Created a new quote with id ' + id);
        });

        query2.on('error', function(error) {
            client.end();
            res.statusCode = 500;
            res.send('Error: ' + JSON.stringify(error));
        });
    });
});

app.delete('/quote/:id', function(req, res) {
  if(quotes.length <= req.params.id) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }

  quotes.splice(req.params.id, 1);
  res.json(true);
});

// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});

