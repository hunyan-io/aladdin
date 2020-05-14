const Command = require("../../../core/Command");
const CardsGame = require("../classes/CardsGame");

const cards = {
    Suna: "https://i.imgur.com/RNidywx.png",
    Taki: "https://i.imgur.com/UiBNjKq.png",
    Kiri: "https://i.imgur.com/w7ztggI.png",
    Kumo: "https://i.imgur.com/67A7P8D.png",
    Konoha: "https://i.imgur.com/tTPoSE6.png",
    facedown: "https://i.imgur.com/Vmc2wen.png",
};

const deck = ["Konoha", "Taki", "Kiri", "Suna", "Kumo"];

class ESP extends CardsGame {
    constructor(host) {
        super(host, {
            cards: cards,
            interRoundTimeout: 5,
            maxRound: 3,
            interRoundSetCards: true,
            cardsPerTurn: 5,
        });
        this.play = 0;
        this.guesser = null;
        this.setter = null;
    }
    async start() {
        super.start();
        for (const gameUser of this.users) {
            gameUser.deck = deck;
        }
        const rand = Math.floor(Math.random() * 2);
        this.guesser = this.users[rand];
        this.setter = this.users[rand ? 0 : 1];
        this.setCards().then(() => {
            super.nextRound();
            this.nextRound();
        });
    }
    setCards() {
        this.guesser.deck = deck;
        this.setter.deck = deck;
        return super.setCards();
    }
    nextRound() {
        this.play++;
        if (this.play > 2) {
            this.play = 1;
            if (!super.nextRound()) {
                return;
            }
        }
        [this.setter, this.guesser] = [this.guesser, this.setter];
        Promise.all([
            this.broadcast.edit(
                1,
                `**Round ${this.round} (Play ${this.play})**\n${this.setter.name} is the setter.\n${this.guesser.name} is the guesser.\nArrange your decks.`
            ),
            this.broadcast.clearAll({
                include: [2, 3, 4],
            }),
        ]).then(() => {
            this.playing = true;
        });
    }
    decideWinner() {
        let points = 0;
        for (let i = 0; i < deck.length; i++) {
            if (this.guesser.playedCards[i] == this.setter.playedCards[i]) {
                points++;
            }
        }
        const s = points != 1 ? "s" : "";
        this.broadcast.edit(
            4,
            `**${this.guesser.name}** guessed **${points}** card${s}. (**+${points}** point${s})\nContinuing in ${this.interRoundTimeout} seconds...`
        );
        return {
            winner: this.guesser,
            points,
            nextRound: true,
        };
    }
    revealCards(orderedUsers) {
        for (let i = 0; i < 2; i++) {
            this.broadcast.edit(i + 2, {
                content: `**${orderedUsers[i].name}** arranged their deck.`,
                embed: {
                    title: orderedUsers[i].playedCards.join("\n"),
                },
            });
        }
    }
    get lastRound() {
        return this.round == this.maxRound && this.play == 2;
    }
}

module.exports = new Command({
    name: "esp",
    description: "Play ESP game.",
    execute({ message }) {
        ESP.from(message);
    },
});
