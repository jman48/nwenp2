var pg = require('pg').native,
    connectionString = process.env.DATABASE_URL,
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
query = client.query('CREATE TABLE users (user_name VARCHAR(50), password VARCHAR(3000))');

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