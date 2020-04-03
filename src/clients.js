const Discord = require("discord.js");
const MongoClient = require("mongodb").MongoClient;

const instances = {};

instances.client = new Discord.Client({
    messageCacheMaxSize: 0
});

instances.database = {};

MongoClient.connect(process.env.DB_URL)
    .then(client => {
        const mongodb = client.db(process.env.DB_NAME);

        instances.database.mongodb = mongodb;
        instances.database.guilds = mongodb.collection("guilds");

        instances.client.login(process.env.TOKEN);
    })
    .catch(err => {
        throw err;
    });

module.exports = instances;
