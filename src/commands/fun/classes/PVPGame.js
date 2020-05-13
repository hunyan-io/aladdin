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
            (user && user.id == message.author.id)
        ) {
            throw new Error("Mention only one user other than yourself.");
        }
        const game = super.from(message);
        if (user) {
            game.add(user, message.channel);
        } else {
            message.channel.send(
                `A new game was created.\nGame Id: ${game.id}`
            );
        }
        return game;
    }
    addJumpTo() {
        for (const gameUser of this.users) {
            if (gameUser.channel.guild) {
                const message = this.broadcast.channels.find(
                    (broadcastChannel) =>
                        broadcastChannel.channel.id == gameUser.channel.id
                ).messages[0];
                gameUser.send({
                    embed: {
                        description: `[Jump to game message.](https://discordapp.com/channels/${gameUser.channel.guild.id}/${gameUser.channel.id}/${message.id})`,
                    },
                });
            }
        }
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
                message += `**${quitUser.tag}** left the game.`;
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
