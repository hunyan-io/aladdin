const Command = require("../../../core/Command");
const CardsGame = require("../classes/CardsGame");

const cards = {
    Earth: "https://i.imgur.com/VO86U7p.png",
    Lightning: "https://i.imgur.com/Q7CtmwX.png",
    Fire: "https://i.imgur.com/PbMrxeG.png",
    Wind: "https://i.imgur.com/HsyJgqo.png",
    Water: "https://i.imgur.com/Pk1UG2j.png",
    facedown: "https://i.imgur.com/pmxkiPg.png",
};

const priorityTable = {
    Earth: ["Water", "Wind"],
    Lightning: ["Earth", "Fire"],
    Fire: ["Earth", "Wind"],
    Wind: ["Water", "Lightning"],
    Water: ["Fire", "Lightning"],
};

const deck = Object.keys(priorityTable);

function decide(user1, user2) {
    if (user1.card == user2.card) return;
    return priorityTable[user1.card].includes(user2.card) ? user1 : user2;
}

class ChakraElements extends CardsGame {
    constructor(host) {
        super(host, {
            cards: cards,
            interRoundTimeout: 0,
            maxRound: 5,
            interRoundSetCards: false,
            announceTimeout: 3,
        });
    }
    async start() {
        super.start();
        for (const gameUser of this.users) {
            gameUser.deck = deck;
        }
        this.setCards().then(() => {
            return this.nextRound();
        });
    }
    nextRound() {
        if (!super.nextRound()) return;
        return Promise.all([
            this.broadcast.edit(1, `**Round ${this.round}**\nPlay your cards.`),
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
    name: "chakra-elements",
    description: "Play chakra elements.",
    aliases: ["chakra", "elements", "chakraelements"],
    execute({ message }) {
        ChakraElements.from(message);
    },
});
