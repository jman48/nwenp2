var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();
query = client.query('CREATE TABLE quotes (quote_id integer UNIQUE NOT NULL, author VARCHAR(255) UNIQUE, text VARCHAR(3000) NOT NULL)');
query.on('end', function(result) { client.end(); });