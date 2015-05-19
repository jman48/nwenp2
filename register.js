var pg = require('pg').native,
    connectionString = 'postgres://ecnbtqsyugvdxf:dxUfMx9EGB1n35Wrw30aplM7ml@ec2-107-20-152-139.compute-1.amazonaws.com:5432/d5ocpahj31f72f',
    client, 
    query,
    hashPass = require('password-hash-and-salt');

client = new pg.Client(connectionString);
client.connect();

client.query('DROP TABLE IF EXISTS user_obj');

//Create a new quotes table
query = client.query('CREATE TABLE user_obj (user_name VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) UNIQUE NOT NULL)');

query.on('end', function(result) {
    client.connect();
    client.query('INSERT INTO user_obj(user_name, password) VALUES($1, $2)', 'User1', 'hash');
//     hashPass('1234').hash(function(error, hash) {
//         client.query('INSERT INTO user_obj(user_name, password) VALUES($1, $2)', 'User1', hash);
//     });    
    
//     hashPass('password').hash(function(error, hash) {
//         client.query('INSERT INTO user_obj(user_name, password) VALUES($1, $2)', 'User2', hash);
//     });
    
    client.end();
});

function createUser(userName, password) {
    client.connect();
    hashPass(password).hash(function(error, hash) {
        var insertUser = client.query('INSERT INTO user_obj(user_name, password) VALUES($1, $2)', userName, hash);
        insertUser.on('end', function(result) {
            client.end();     
        })
    });
}