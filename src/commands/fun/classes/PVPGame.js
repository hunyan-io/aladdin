const Emojis = require("../../../enums/Emojis");
const Game = require("./Game");

class PVPGame extends Game {
    constructor(host, channel, userClass) {
        super(host, userClass);
        this.add(host, channel);
    }
    static from(message) {
        const user = message.mentions.users.first();
        if (
            message.mentions.users.size > 1 ||
            (user && (user.id == message.author.id || user.bot))
        ) {
            throw new Error("Mention only one user other than yourself.");
        }
        const game = super.from(message);
        game.broadcast.add(message.channel);
        if (user) {
            message.author.createDM().then((dmChannel) => {
                game.broadcast.add(dmChannel);
                game.add(user);
            });
        } else {
            message.channel.send(
                `A new game was created.\nGame Id: ${game.id}`
            );
        }
        return game;
    }
    add(user, channel) {
        super.add(user, channel);
        if (this.users.length == 2) {
            this.locked = true;
            this.start();
        }
    }
    start() {
        this.updateScores();
    }
    updateScores(gameOver = false, quitUser) {
        let message = `**Game ${
            gameOver ? "Over" : "Start"
        }**\nPlayers:\n${this.users
            .map(
                (gameUser) =>
                    `**${gameUser.name}**: ${gameUser.points} point${
                        gameUser.points != 1 ? "s" : ""
                    }`
            )
            .join("\n")}`;
        if (gameOver) {
            if (quitUser) {
                message += `\n**${quitUser.tag}** left the game.`;
            } else {
                if (this.users[0].points == this.users[1].points) {
                    message += "\nThe game ended in a draw.";
                } else {
                    const winner =
                        this.users[0].points > this.users[1].points
                            ? this.users[0]
                            : this.users[1];
                    message += `\n**${winner.name}** won the game.`;
                }
            }
        }
        this.broadcast.edit(0, message).finally(() => {
            if (gameOver) {
                this.broadcast.reduce(0);
                this.destroy();
            }
        });
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
    quit(user) {
        if (this.users.length >= 2) {
            this.updateScores(true, user);
        } else {
            this.destroy();
        }
        super.quit(user);
    }
}

module.exports = PVPGame;
