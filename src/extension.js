const { Base, Message } = require("discord.js");

const EventTimeout = require("./utils/EventTimeout");

const { client } = require("./clients");

// Extending Base class, which includes Message and Channel, with EventTimeout (EventEmitter)

Base.prototype.__proto__ = EventTimeout.prototype;

Base.__proto__ = EventTimeout;

client.on("messageReactionAdd", (reaction, user) => {
    reaction.message.emit("reactionAdd", reaction, user);
    // reaction.message.channel.emit('messageReactionAdd', reaction, user);
});

Message.prototype.respond = async function (message, channel) {
    this.cache = this.cache || new Set();
    const response = await (channel || this.channel).send(message);
    this.cache.add(response);
    return response;
};

const onChange = (message) => {
    if (message.cache) {
        for (const msg of message.cache) {
            msg.delete();
        }
        delete message.cache;
    }
};

client.on("messageDelete", onChange);
client.on("messageUpdate", (_, message) => onChange(message));
