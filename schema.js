var pg = require('pg').native
  , connectionString = 'postgres://ecnbtqsyugvdxf:dxUfMx9EGB1n35Wrw30aplM7ml@ec2-107-20-152-139.compute-1.amazonaws.com:5432/d5ocpahj31f72f'
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

//Create a new quotes table
query = client.query('CREATE TABLE quotes (quote_id integer UNIQUE NOT NULL, author VARCHAR(255) UNIQUE, text VARCHAR(3000) NOT NULL)');
query.on('end', function(result) { client.end(); });