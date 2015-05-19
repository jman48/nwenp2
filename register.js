var pg = require('pg').native,
    connectionString = process.env.DATABASE_URL,
    client, query;
client = new pg.Client(connectionString);
client.connect();
//Create a new quotes table
query = client.query('CREATE TABLE user (user_name VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) UNIQUE NOT NULL)');

query.on('end', function(result) {
    createUser('User1', '1234');
    createUser('User2', 'password');
    client.end();
});

function createUser(userName, password) {
    password(password).hash(function(error, hash) {
        var insertUser = client.query('INSERT INTO user(user_name, password) VALUES($1, $2)', userName, hash);
        query.on('end', function(result) {
            client.end();
        });
    });
}