require("dotenv").config();
const { client } = require("./clients");

const CommandManager = require("./core/CommandManager");

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageUpdate", async message => {
    if (message.author.bot) return;

    if (await CommandManager.isCommand(message)) {
        CommandManager.execute(message);
    }
});

client.on("message", async message => {
    if (message.author.bot) return;

    if (await CommandManager.isCommand(message)) {
        CommandManager.execute(message);
    }
});

CommandManager.init();
