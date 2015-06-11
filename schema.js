var pg = require('pg').native
    , connectionString = process.env.DATABASE_URL
    , client
    , query;

client = new pg.Client(connectionString);
client.connect();

client.query("DROP TABLE IF EXISTS quotes");

//Create a new quotes table
query = client.query('CREATE TABLE quotes (quote_id integer UNIQUE NOT NULL, author VARCHAR(255) UNIQUE, text text NOT NULL)');

query.on('end', function (result) {
    console.log('Quotes table created successfully');
    client.end();
});

query.on('error', function (result) {
    console.log('Error: ' + result);
    client.end();
});