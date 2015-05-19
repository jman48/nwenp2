var pg = require('pg').native,
    connectionString = 'postgres://ecnbtqsyugvdxf:dxUfMx9EGB1n35Wrw30aplM7ml@ec2-107-20-152-139.compute-1.amazonaws.com:5432/d5ocpahj31f72f',
    client, 
    query,
    hashPass = require('password-hash-and-salt');

client = new pg.Client(connectionString);
client.connect();

var drop = client.query('DROP TABLE userobj');

drop.on('error', function(error) {
    console.log('Error: ' + JSON.stringify(error));
});

//Create a new quotes table
query = client.query('CREATE TABLE userobj (user_name VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) UNIQUE NOT NULL)');

query.on('end', function(result) {
    client.connect();
    var query2 = client.query('INSERT INTO userobj(user_name, password) VALUES($1, $2)', ['User1', 'hash']);
    //ertQuery = client.query('INSERT INTO quotes(quote_id, author, text) VALUES($1, $2, $3)', [id, req.body.author, req.body.text]);
    
//     query2.on('error', function(error) {
//         console.log('Error 2: ' + JSON.stringify(error));
//     });
//     hashPass('1234').hash(function(error, hash) {
//         client.query('INSERT INTO user_obj(user_name, password) VALUES($1, $2)', 'User1', hash);
//     });    
    
//     hashPass('password').hash(function(error, hash) {
//         client.query('INSERT INTO user_obj(user_name, password) VALUES($1, $2)', 'User2', hash);
//     });
    
    client.end();
});

query.on('error', function(error) {
    console.log('Error 3: ' + JSON.stringify(error));
});