const PVPGame = require("./PVPGame");
const GameUser = require("./GameUser");

const EMPTY = {
    content: String.fromCharCode(173),
    embed: null,
};

class CardUser extends GameUser {
    constructor(user, game) {
        super(user, game);
        this.turn = false;
        this.points = 0;
        this.card = null;
        this._deck = null;
        this.usedMessages = null;
        this.playedCards = null;
    }
    set deck(value) {
        this._deck = value.map((card) => ({
            name: typeof card == "string" ? card : card.name,
            number: isNaN(card.number) ? 1 : card.number,
        }));
    }
    get deck() {
        return this._deck;
    }
    newTurn() {
        this.turn = true;
        this.usedMessages = new Set();
        this.playedCards = [];
    }
}

class CardsGame extends PVPGame {
    constructor(host, options = {}) {
        super(host, {}, CardUser);
        options = Object.assign(
            this,
            {
                interRoundTimeout: 0,
                cards: {},
                maxRound: 3,
                interRoundSetCards: false,
                cardsPerTurn: 1,
            },
            options
        );
        this.announceTimeout = isNaN(this.announceTimeout)
            ? this.interRoundTimeout
            : this.announceTimeout;
        this.round = 0;
        this.playing = false;
    }
    start() {
        this.updateScores();
    }
    nextRound() {
        this.round++;
        if (this.round > this.maxRound) {
            this.updateScores(true);
            return false;
        }
        return true;
    }
    setCards() {
        const promises = [];
        for (const gameUser of this.users) {
            let index = -1;
            for (let card of gameUser.deck) {
                index++;
                if (card.number === 0) continue;
                const msg = {
                    embed: {
                        title:
                            card.name +
                            (card.number > 1 ? ` x${card.number}` : ""),
                        image: {
                            url: this.cards[card.name],
                        },
                    },
                };
                if (gameUser.messages[index]) {
                    gameUser.messages[index].edit(msg);
                } else {
                    let messageIndex = index;
                    promises.push(
                        gameUser.send(msg, false).then((message) => {
                            gameUser.messages[messageIndex] = message;
                            return [gameUser, message];
                        })
                    );
                }
            }
            gameUser.newTurn();
        }
        return Promise.all(promises).then((list) => {
            for (const [gameUser, message] of list) {
                this.setEvent(message, gameUser);
            }
        });
    }
    async onReact({ message }, gameUser) {
        if (!gameUser.turn) return;
        if (!this.playing) return;
        if (!message.embeds[0] || !message.embeds[0].title) return;
        if (gameUser.usedMessages.has(message)) return;
        const match = message.embeds[0].title.match(/^(.*?) x\d+$/);
        const cardName = match ? match[1] : message.embeds[0].title;
        const card = gameUser.deck.find(
            (gameCard) => gameCard.name == cardName
        );
        if (!card || !card.number) return;
        card.number--;
        if (card.number) {
            message.edit({
                embed: {
                    title:
                        card.name + (card.number > 1 ? ` x${card.number}` : ""),
                    image: {
                        url: this.cards[card.name],
                    },
                },
            });
        } else {
            gameUser.usedMessages.add(message);
            message.edit(EMPTY);
        }
        gameUser.card = card.name;
        gameUser.playedCards.push(card.name);
        if (gameUser.playedCards.length < this.cardsPerTurn) return;
        gameUser.turn = false;
        const gameUser2 = this.users.find((u) => u.user.id != gameUser.user.id);
        if (
            gameUser2.playedCards.length >= this.cardsPerTurn &&
            !gameUser2.turn
        ) {
            this.playing = false;
            this.revealCards([gameUser2, gameUser]);
            const { winner, points, nextRound } = this.decideWinner(
                gameUser,
                gameUser2
            );
            let promise;
            if (winner) {
                winner.points += points;
                this.updateScores();
            }
            if (nextRound) {
                if (this.interRoundSetCards && !this.lastRound) {
                    promise = this.setCards();
                }
                setTimeout(
                    () =>
                        promise
                            ? promise.then(() => this.nextRound())
                            : this.nextRound(),
                    (!this.lastRound
                        ? this.interRoundTimeout
                        : this.announceTimeout) * 1000
                );
            }
        } else {
            if (!this.broadcast.isEmpty(2)) {
                await this.broadcast.clearAll({
                    include: [3, 4],
                });
            }
            this.broadcast.edit(2, {
                content: `**${gameUser.name}** played their card.`,
                embed: {
                    image: {
                        url: this.cards.facedown,
                    },
                },
            });
        }
    }
    revealCards(orderedUsers) {
        for (let i = 0; i < 2; i++) {
            this.broadcast.edit(i + 2, {
                content: `**${orderedUsers[i].name}** played their cards.`,
                embed: {
                    title: orderedUsers[i].card,
                    image: {
                        url: this.cards[orderedUsers[i].card],
                    },
                },
            });
        }
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
    quit(user) {
        if (this.users.length >= 2) {
            this.updateScores(true, user);
            super.quit(user, false);
        } else {
            super.quit(user);
        }
    }
    get lastRound() {
        return this.round == this.maxRound;
    }
}

module.exports = CardsGame;
