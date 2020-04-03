const Discord = require("discord.js");
const MongoClient = require("mongodb").MongoClient;
const mongomock = require("./utils/mongomock");

const instances = {};

instances.client = new Discord.Client({
    messageCacheMaxSize: 0
});

instances.database = {};

const init = client => {
    const mongodb = client.db(process.env.DB_NAME);

    instances.database.mongodb = mongodb;
    instances.database.guilds = mongodb.collection("guilds");

    instances.client.login(process.env.TOKEN);
};

if (process.env.DB_URL && process.env.DB_NAME) {
    MongoClient.connect(process.env.DB_URL)
        .then(init)
        .catch(err => {
            throw err;
        });
} else {
    // Launch bot without database FOR DEBUG PURPOSES.
    console.log("WARNING: BOT IS RUNNING WITHOUT A DATABASE.");

    init(mongomock);
}

module.exports = instances;
