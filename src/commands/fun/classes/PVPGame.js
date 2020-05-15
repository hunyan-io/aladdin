const Emojis = require("../../../enums/Emojis");
const Game = require("./Game");

class PVPGame extends Game {
    constructor(host, options = {}, userClass) {
        super(host, userClass);
        Object.assign(
            this,
            {
                broadcastDM: true,
            },
            options
        );
        this.add(host);
    }
    static from(message, ...args) {
        const user = message.mentions.users.first();
        if (
            message.mentions.users.size > 1 ||
            (user && (user.id == message.author.id || user.bot))
        ) {
            throw new Error("Mention only one user other than yourself.");
        }
        if (user && user.game) {
            throw new Error("Mentioned user is already ingame.");
        }
        const game = super.from(message, ...args);
        game.broadcast.add(message.channel);
        if (user) {
            game.add(user);
        } else {
            message.channel.send(
                `A new game was created.\nGame Id: ${game.id}`
            );
        }
        return game;
    }
    add(user) {
        const callback = (dmChannel) => {
            if (dmChannel) {
                this.broadcast.add(dmChannel);
            }
            super.add(user);
            if (this.users.length == 2) {
                this.locked = true;
                this.start();
            }
        };
        if (this.broadcastDM) {
            user.createDM().then(callback);
        } else {
            callback();
        }
    }
    setEvent(message, gameUser) {
        message.react(Emojis.checkmark);
        message.on("reactionAdd", (reaction, user) => {
            if (user.bot) return;
            if (user.id != gameUser.user.id) return;
            if (reaction.emoji.toString() != Emojis.checkmark) return;
            this.onReact(reaction, gameUser);
        });
    }
    onReact() {}
    destroy() {
        for (const gameUser of this.users) {
            for (const message of gameUser.messages) {
                message.removeAllListeners("reactionAdd");
            }
        }
        super.destroy();
    }
    quit(user, destroy = true) {
        if (destroy) {
            this.destroy();
        }
        super.quit(user);
    }
}

module.exports = PVPGame;
