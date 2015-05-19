var pg = require('pg').native,
    connectionString = process.env.DATABASE_URL,
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
     createUser('User1', '1234', function(){});
    createUser('User2', 'password', function() {
             client.end();
         });
});

function createUser(userName, password, callback) {
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