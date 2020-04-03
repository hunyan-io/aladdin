const { client, database } = require("../clients");
const MongoClient = require("mongodb").MongoClient;

const guilds = {};

class GuildData {
    constructor(guild) {
        this.prefix = null;
        this.guild = guild;
    }
    async init() {
        let data = await database.guilds.findOne({ _id: this.guild.id });
        if (!data) {
            // TODO: only create document in case a new change was made
            data = await database.guilds.insertOne({ _id: this.guild.id });
        }
        this.prefix = data.prefix || null;
    }
    static async from(guild) {
        guild = typeof guild == "string" ? client.guilds.get(guild) : guild;
        if (guilds.hasOwnProperty(guild.id)) {
            return guilds[guild.id];
        } else {
            const guildData = new this(guild);
            const promise = guildData.init().then(() => {
                guilds[guild.id] = guildData;
                return guildData;
            }); // not using await is intended

            // fill the guilds object so that this block doesn't get executed again in case of another GuildData request
            guilds[guild.id] = promise;

            return promise;
        }
    }
}

module.exports = GuildData;
