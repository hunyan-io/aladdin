const Command = require("../../core/Command");
const { client } = require("../../clients");

module.exports = new Command({
    name: "js",
    aliases: ["javascript"],
    execute(parameters) {
        if (parameters.message.author.id !== "219451307247796224") return;

        const match = parameters.command.content.match(
            /^(```|`)([a-zA-Z+-]*\n+)?(.*)\1/s
        );
        if (!match) {
            throw new Error(
                `Invalid syntax for subcommand ${parameters.command.name} of command ${parameters.command.super.name}`
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
    }
});
