const Command = require("../../../core/Command");
const CardsGame = require("../classes/CardsGame");

const cards = {
    Emperor: "https://i.imgur.com/lzpvGjL.png",
    Slave: "https://i.imgur.com/ZvG0fwL.png",
    Citizen: "https://i.imgur.com/TdpwVgA.png",
    facedown: "https://i.imgur.com/zLP9OBR.png",
};

const decks = [
    ["Emperor", { name: "Citizen", number: 4 }],
    ["Slave", { name: "Citizen", number: 4 }],
];

const priorityTable = {
    Emperor: "Citizen",
    Slave: "Emperor",
    Citizen: "Slave",
};

function decide(user1, user2) {
    if (user1.card == user2.card) return;
    return priorityTable[user1.card] == user2.card ? user1 : user2;
}

class Ecard extends CardsGame {
    constructor(host) {
        super(host, {
            cards: cards,
            interRoundTimeout: 5,
            maxRound: 3,
            interRoundSetCards: true,
        });
        this.play = 0;
    }
    async start() {
        super.start();
        const rand = Math.floor(Math.random() * 2);
        this.users[0].deck = decks[rand];
        this.users[1].deck = decks[rand ? 0 : 1];
        this.setCards().then(() => {
            super.nextRound();
            this.nextRound();
        });
    }
    nextRound() {
        this.play++;
        if (this.play > 2) {
            this.play = 1;
            if (!super.nextRound()) {
                return;
            }
        }
        Promise.all([
            this.broadcast.edit(
                1,
                `**Round ${this.round} (Play ${this.play})**\nPlay your cards.`
            ),
            this.broadcast.clearAll({
                include: [2, 3, 4],
            }),
        ]).then(() => {
            this.playing = true;
        });
    }
    setCards() {
        const firstDeck =
            this.users[0].deck[0].name == "Emperor" ? decks[1] : decks[0];
        this.users[0].deck = firstDeck;
        this.users[1].deck = firstDeck == decks[0] ? decks[1] : decks[0];
        return super.setCards();
    }
    decideWinner(gameUser, gameUser2) {
        const winner = decide(gameUser, gameUser2);
        if (!winner) {
            this.broadcast
                .edit(4, "It's a tie! Play a card again.")
                .then(() => {
                    this.playing = true;
                    gameUser.turn = true;
                    gameUser2.turn = true;
                });
            return {
                winner: null,
                points: null,
                nextRound: false,
            };
        }
        const points = winner.deck[0].name == "Emperor" ? 1 : 3;
        this.broadcast.edit(
            4,
            `**${winner.name}** won. (+${points} point${
                points != 1 ? "s" : ""
            })\nContinuing in ${this.interRoundTimeout} seconds...`
        );
        return {
            winner,
            points,
            nextRound: true,
        };
    }
    get lastRound() {
        return this.round == this.maxRound && this.play == 2;
    }
}

module.exports = new Command({
    name: "e-card",
    description: "Play ecard.",
    aliases: ["ecard", "ecards", "e-cards"],
    execute({ message }) {
        Ecard.from(message);
    },
});
