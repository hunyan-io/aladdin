const Command = require("../../core/Command");
const { client } = require("../../clients");

module.exports = new Command({
    name: "js",
    description: "Executes javascript in the bot's environment.",
    aliases: ["javascript"],
    private: true,
    execute(parameters) {
        if (parameters.message.author.id !== "219451307247796224") return;

        const match = parameters.command.content.match(
            /^(```|`)([a-zA-Z+-]*\n+)?(.*)\1/s
        );
        if (!match) {
            throw new Error(
                `Invalid syntax for command ${parameters.command.name}.`
            );
        }

        let [, delimiter, syntax, code] = match;
        if (delimiter == "`" && syntax) {
            code = syntax + code;
        }

        let console = {};
        console.log = (...args) => {
            for (const arg of args) {
                parameters.message.channel.send(String(arg));
            }
        };

        eval(code);
    },
});
