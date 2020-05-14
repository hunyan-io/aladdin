const shortid = require("shortid");

const { client } = require("../../../clients");
const GameUser = require("./GameUser");
const Broadcast = require("./Broadcast");

const EMPTY = String.fromCharCode(173);
const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

function numToAlpha(n) {
    const rand = Math.floor(Math.random() * 3);
    if (rand == 0) {
        return alphabet[n].toUpperCase();
    } else if (rand == 1) {
        return alphabet[n];
    } else {
        return n;
    }
}

function alphaToNum(a) {
    if (isNaN(a)) {
        return alphabet.indexOf(a);
    } else {
        return a;
    }
}

class Game {
    constructor(host, userClass = GameUser) {
        this.users = [];
        this.host = host;
        this.userClass = userClass;
        this.broadcast = new Broadcast();
        this.locked = false;
        this.id =
            host.id.split("").map(numToAlpha).join("") +
            "-" +
            shortid.generate();
    }
    static parseId(id) {
        const lowercase = id.toLowerCase();
        const index = lowercase.indexOf("-");
        if (index == -1) return;
        const user = client.users.resolve(
            lowercase.slice(0, index).split("").map(alphaToNum).join("")
        );
        if (!user || !user.game || id != user.game.id) return;
        return user;
    }
    static from(message) {
        if (message.author.game) {
            throw new Error("You're already in a game.");
        }
        return new this(message.author);
    }
    add(user) {
        if (this.users.find((player) => player.user.id == user.id)) {
            throw new Error("You've already joined.");
        }
        if (this.locked) {
            throw new Error("The game is locked.");
        }
        this.users.push(new this.userClass(user, this));
        user.game = this;
    }
    destroy() {
        for (const gameUser of this.users) {
            gameUser.destroy();
        }
    }
    quit(user) {
        const userIndex = this.users.findIndex(
            (gameUser) => gameUser.user.id == user.id
        );
        if (!userIndex) return;
        this.users.splice(userIndex, 1);
    }
}

module.exports = Game;
