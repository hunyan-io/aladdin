const fs = require("fs");
const path = require("path");

const GuildData = require("./GuildData");
const CommandParameters = require("./CommandParameters");
const Colors = require("../enums/Colors");

class CommandManager {
    static commands;

    static init() {
        this.commands = fs
            .readdirSync(path.join(__dirname, "..", "commands"))
            .map(dir =>
                fs
                    .readdirSync(path.join(__dirname, "..", "commands", dir))
                    .filter(commandName => !commandName.startsWith("_"))
                    .map(commandName =>
                        require(`../commands/${dir}/${commandName}`)
                    )
            )
            .flat()
            .reduce((commands, command) => {
                if (commands[command.name]) {
                    throw new Error(`command ${command.name} is duplicated.`);
                }
                commands[command.name] = command;
                for (const alias of command.aliases) {
                    if (commands[alias]) {
                        throw new Error(
                            `alias ${alias} of command ${command.name} is duplicated.`
                        );
                    }
                    commands[alias] = command;
                }
                return commands;
            }, {});
        for (const command of Object.values(this.commands)) {
            if (command.init) {
                Promise.resolve(command.init())
                    .then(() => {
                        command.ready = true;
                    })
                    .catch(console.error);
            } else {
                command.ready = true;
            }
        }
    }
    static async isCommand(message) {
        return message.content.startsWith(
            (message.guild && (await GuildData.from(message.guild)).prefix) ||
                process.env.PREFIX
        );
    }
    static async execute(message) {
        const parameters = await CommandParameters.from(message);
        if (this.commands[parameters.command.name]) {
            this.evaluate(this.commands[parameters.command.name], parameters);
        }
    }
    static async evaluate(command, parameters) {
        if (command.ready) {
            if (command.subcommands) {
                parameters.extend();
                if (
                    command.subcommands.hasOwnProperty(parameters.command.name)
                ) {
                    return this.evaluate(
                        command.subcommands[parameters.command.name],
                        parameters
                    );
                }
                parameters.fallback();
            }
            try {
                await Promise.resolve(command.execute(parameters));
            } catch (e) {
                // This is going to be changed later, in case of no permission to send msg
                // Keeping this for debug
                parameters.message.channel.send({
                    embed: {
                        color: Colors.ERROR,
                        title: "Error",
                        timestamp: Date.now(),
                        description:
                            `The following error occured while executing command ${command.name}:` +
                            "```" +
                            e.toString().slice(0, 1500) +
                            "```"
                    }
                });
            }
        }
    }
}

module.exports = CommandManager;
