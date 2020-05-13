const Command = require("../../../core/Command");
const CardsGame = require("../classes/CardsGame");

const cards = {
    Rock: "https://i.imgur.com/UN3jn1t.png",
    Paper: "https://i.imgur.com/rIUhUzP.png",
    Scissor: "https://i.imgur.com/wT48bHJ.png",
    facedown: "https://i.imgur.com/UkYNDvA.png",
};

const priorityTable = {
    Rock: "Scissor",
    Paper: "Rock",
    Scissor: "Paper",
};

const deck = [
    { name: "Rock", number: 3 },
    { name: "Paper", number: 3 },
    { name: "Scissor", number: 3 },
];

function decide(user1, user2) {
    if (user1.card == user2.card) return;
    return priorityTable[user1.card] == user2.card ? user1 : user2;
}

class CardRPS extends CardsGame {
    constructor(host, channel) {
        super(host, channel, {
            cards: cards,
            interRoundTimeout: 0,
            maxRound: 9,
            interRoundSetCards: false,
            announceTimeout: 3,
        });
    }
    async start() {
        super.start();
        for (const gameUser of this.users) {
            gameUser.deck = deck;
        }
        this.setCards()
            .then(() => {
                return this.nextRound();
            })
            .then(() => {
                this.addJumpTo();
            });
    }
    nextRound() {
        if (!super.nextRound()) return;
        return Promise.all([
            this.broadcast.edit(1, "**Play your cards.**"),
            this.round == 1 &&
                this.broadcast.clearAll({
                    include: [2, 3, 4],
                }),
        ]).then(() => {
            this.playing = true;
        });
    }
    decideWinner(gameUser, gameUser2) {
        const winner = decide(gameUser, gameUser2);
        this.broadcast
            .edit(
                4,
                winner
                    ? `**${winner.name}** won. (+1 point)${
                          this.round == this.maxRound
                              ? `\nShowing results in ${this.announceTimeout} seconds.`
                              : "\nPlay a card again."
                      }`
                    : "It's a tie! Play a card again."
            )
            .then(() => {
                this.playing = true;
                gameUser.turn = true;
                gameUser2.turn = true;
            });
        return {
            winner: winner,
            points: winner ? 1 : null,
            nextRound: true,
        };
    }
}

module.exports = new Command({
    name: "cardrps",
    description: "Play Card RPS.",
    aliases: ["rpscard", "card-rps", "rps-card"],
    execute({ message }) {
        CardRPS.from(message);
    },
});
