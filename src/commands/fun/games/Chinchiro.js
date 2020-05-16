const Command = require("../../../core/Command");
const PVPGame = require("../classes/PVPGame");
const GameUser = require("../classes/GameUser");
const Emojis = require("../../../enums/Emojis");

const diceRoll = () => Math.floor(Math.random() * 6) + 1;

function decide(users) {
    const values = users.map((gameUser) => gameUser.rollValue);
    if (values[0][0] === values[1][0]) {
        if (values[0][1] === values[1][1]) {
            return null;
        } else {
            return values[0][1] > values[1][1] ? users[0] : users[1];
        }
    } else {
        return values[0][0] > values[1][0] ? users[0] : users[1];
    }
}

class ChinchiroUser extends GameUser {
    constructor(user, game) {
        super(user, game);
        this.rolls = 3;
        this.rollResult = null;
    }
    async roll() {
        if (this.rolls > 0) {
            this.rolls--;
            this.rollResult = [diceRoll(), diceRoll(), diceRoll()];
            const rollStr = this.rollResult.join("-");
            if (rollStr == "1-2-3" || rollStr == "4-5-6") {
                this.rolls = 0;
            }
            if (this.messages[0]) {
                this.messages.shift().delete();
            }
            const message = await this.send(
                `You got **${rollStr}**.${this.rolls ? " Roll again?" : ""}`,
                !!this.rolls
            );
            if (this.rolls) {
                message.react(Emojis.checkmark);
                message.react(Emojis.crossmark);
                message.on("reactionAdd", (reaction, user) => {
                    if (user.bot) return;
                    message.removeAllListeners("reactionAdd");
                    switch (reaction.emoji.toString()) {
                        case Emojis.crossmark:
                            this.rolls = 0;
                            reaction.message.reactions.removeAll();
                        case Emojis.crossmark:
                        case Emojis.checkmark:
                            this.roll();
                            break;
                    }
                });
            }
        }
        if (this.rolls === 0) {
            this.game.checkRolls();
        }
    }
    get rollValue() {
        const roll = this.rollResult;
        const rollStr = roll.join("-");
        if (rollStr == "1-2-3") {
            return [0, 0];
        } else if (rollStr == "4-5-6") {
            return [4, 0];
        } else if (
            roll[0] == roll[1] ||
            roll[0] == roll[2] ||
            roll[1] == roll[2]
        ) {
            const value =
                roll[0] == roll[1]
                    ? roll[2]
                    : roll[0] == roll[2]
                    ? roll[1]
                    : roll[0];
            return [2, value];
        } else if (roll[0] == roll[1] && roll[1] == roll[2]) {
            return [3, roll[0]];
        } else {
            return [1, 0];
        }
    }
}

class Chinchiro extends PVPGame {
    constructor(host) {
        super(host, {}, ChinchiroUser);
        this.playing = false;
    }
    start() {
        this.broadcast.send(`**Game Start**\nRolling the dice...`);
        for (const gameUser of this.users) {
            gameUser.roll();
        }
        this.playing = true;
    }
    checkRolls() {
        if (!this.playing) return;
        if (this.users.some((gameUser) => gameUser.rolls > 0)) return;
        this.playing = false;
        const message = ["**Chinchiro Game Over**"];
        for (const gameUser of this.users) {
            message.push(
                `**${gameUser.name}** got **${gameUser.rollResult.join("-")}**.`
            );
        }
        const winner = decide(this.users);
        message.push(
            winner
                ? `**${winner.name}** won the game.`
                : `The game ended in a draw.`
        );
        this.broadcast.reduce(null);
        this.broadcast.send(message.join("\n"), false);
        this.destroy();
    }
}

module.exports = new Command({
    name: "chinchiro",
    description: "Play Chinchiro.",
    execute({ message }) {
        Chinchiro.from(message);
    },
});
