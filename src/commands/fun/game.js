const fs = require("fs").promises;
const path = require("path");

const Game = require("./classes/Game");
const Command = require("../../core/Command");

module.exports = new Command({
    name: "game",
    description: "Play a game.",
    async init() {
        (await fs.readdir(path.join(__dirname, "games"))).forEach((file) => {
            const game = require(`./games/${file}`);
            this.subcommand(game);
        });
    },
    async execute({ message, command }) {
        const user = Game.parseId(command.content);
        if (!user) {
            throw new Error(`There is no game with that name or id.`);
        }
        // user.game.add(message.author, message.channel);
        user.game.add(message.author, await message.author.createDM());
    },
}).subcommand({
    name: "quit",
    description: "Quit current game.",
    execute({ message }) {
        const game = message.author.game;
        if (!game) {
            throw new Error("You are not ingame.");
        }
        game.quit(message.author);
    },
});
