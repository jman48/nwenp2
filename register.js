var pg = require('pg').native,
    connectionString = 'postgres://ecnbtqsyugvdxf:dxUfMx9EGB1n35Wrw30aplM7ml@ec2-107-20-152-139.compute-1.amazonaws.com:5432/d5ocpahj31f72f',
    client, 
    query,
    hashPass = require('password-hash-and-salt');

client = new pg.Client(connectionString);
client.connect();

var drop = client.query('DROP TABLE users');

drop.on('error', function(error) {
    console.log('Error: ' + JSON.stringify(error));
    client.end();
});

//Create a new quotes table
query = client.query('CREATE TABLE users (user_name VARCHAR(50), password VARCHAR(3000))');

query.on('end', function(result) {
     createUser('User1', '1234', function () {
         createUser('User2', 'password', function() {
             client.end();
         });
     });
});

function createUser(userName, password, callback) {
    client.connect();
    hashPass('1234').hash(function(error, hash) {
        var insertquery = client.query('INSERT INTO users(user_name, password) VALUES($1, $2)', [userName, 'test']);
        insertquery.on('end', function(result) {
            callback();
        });
        
        insertquery.on('error', function(error) {
            console.log('Error 3: ' + error);
        });
    });
}

query.on('error', function(error) {
    console.log('Error 3: ' + JSON.stringify(error));
    client.end();
});