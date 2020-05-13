require("dotenv").config();
require("./extension");

const { client, init } = require("./clients");

const CommandManager = require("./core/CommandManager");

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const onMessage = async (message) => {
    if (message.author.bot) return;

    if (await CommandManager.isCommand(message)) {
        CommandManager.execute(message);
    }
};

client.on("message", onMessage);

client.on("messageUpdate", (_, message) => onMessage(message));

CommandManager.init();

init();
