var pg = require('pg').native,
    connectionString = 'postgres://ecnbtqsyugvdxf:dxUfMx9EGB1n35Wrw30aplM7ml@ec2-107-20-152-139.compute-1.amazonaws.com:5432/d5ocpahj31f72f',
    client,
    query,
    hashPass = require('password-hash-and-salt');

client = new pg.Client(connectionString);
client.connect();

var drop = client.query('DROP TABLE IF EXISTS users');

drop.on('error', function(error) {
    console.log('Drop database error' + JSON.stringify(error));
    client.end();
});

//Create a new quotes table
query = client.query('CREATE TABLE users (user_name VARCHAR(120), password text, access_token text)');

query.on('end', function(result) {
    createUser('User1', '1234', function() {
        createUser('User2', 'password', function() {
            client.end();
        });
    });
});

/**
 * Create a user and then call the callback function on success
 */
function createUser(userName, password, callback) {
    hashPass(password).hash(function(hashError, hash) {
        if(hashError) {
            console.log('Error 500: ' + hashError);
        }
        
        var insertquery = client.query('INSERT INTO users(user_name, password) VALUES($1, $2)', [userName, hash]);
        
        insertquery.on('end', function(result) {
            console.log(result);
            callback();
        });
        
        insertquery.on('error', function(error) {
            console.log('Insert query error: ' + error);
        });
    });
}

query.on('error', function(error) {
    console.log('Create table error: ' + JSON.stringify(error));
    client.end();
});