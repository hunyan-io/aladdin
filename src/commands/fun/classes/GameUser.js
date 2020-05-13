const { Message } = require("discord.js");

const EMPTY = {
    content: String.fromCharCode(173),
    embed: null,
};

class GameUser {
    constructor(user, game, channel) {
        this.user = user;
        this.game = game;
        this.channel = channel;
        this.messages = [];
    }
    send(message, cache = true) {
        return this.user.send(message).then((msg) => {
            if (cache) {
                this.messages.push(msg);
            }
            return msg;
        });
    }
    destroy() {
        delete this.user.game;
        for (const message of this.messages) {
            message.delete();
        }
        delete this.messages;
        delete this.game;
    }
    get name() {
        return this.user.tag;
    }
}

module.exports = GameUser;
