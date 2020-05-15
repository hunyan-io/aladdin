const Discord = require("discord.js");
const MongoClient = require("mongodb").MongoClient;
const MongoMock = require("./utils/MongoMock");

const instances = {};

instances.client = new Discord.Client({
    fetchAllMembers: true,
});

instances.database = {};

const onInit = (client) => {
    const mongodb = client.db(process.env.DB_NAME);

    instances.database.mongodb = mongodb;
    instances.database.guilds = mongodb.collection("guilds");

    instances.client.login(process.env.TOKEN);
};

instances.init = () => {
    if (process.env.DB_URL && process.env.DB_NAME) {
        MongoClient.connect(process.env.DB_URL)
            .then(onInit)
            .catch((err) => {
                throw err;
            });
    } else {
        // Launch bot without database FOR DEBUG PURPOSES.
        console.log("WARNING: BOT IS RUNNING WITHOUT A DATABASE.");

        onInit(MongoMock);
    }
};

module.exports = instances;
