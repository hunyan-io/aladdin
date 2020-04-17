const fs = require("fs");
const path = require("path");
const {
    Permissions: { FLAGS: PERMISSIONS },
} = require("discord.js");

const { client } = require("../clients");
const GuildData = require("./GuildData");
const CommandParameters = require("./CommandParameters");
const Colors = require("../enums/Colors");

async function hasPermissions(permissions, member, defaultChannel, sendError) {
    if (!permissions || !member) return;
    for (const entry of permissions) {
        let channel, permission;
        if (typeof entry == "number") {
            permission = entry;
        } else if (Array.isArray(entry)) {
            [permission, channel] = entry;
        } else {
            continue;
        }
        if (typeof channel == "string") {
            channel = await client.channels.fetch(channel);
        } else if (typeof channel == "function") {
            channel = await Promise.resolve(channel(parameters));
        } else {
            channel = defaultChannel;
        }
        if (
            permission &&
            channel &&
            channel.permissionsFor &&
            !channel.permissionsFor(member).has(permission)
        ) {
            if (sendError) {
                defaultChannel.send({
                    embed: {
                        color: Colors.ERROR,
                        title: "Missing Permission",
                        timestamp: Date.now(),
                        description: `Sorry${
                            member == defaultChannel.guild.me
                                ? ", I'm missing"
                                : ` ${member}, you can't use this command unless you have`
                        } the permission to ${Object.keys(PERMISSIONS)
                            .find((key) => PERMISSIONS[key] == permission)
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/guild/g, "server")}.`,
                    },
                });
            }

            return false;
        }
    }
    return true;
}

class CommandManager {
    static commands;

    static init() {
        this.commands = fs
            .readdirSync(path.join(__dirname, "..", "commands"))
            .map((dir) =>
                fs
                    .readdirSync(path.join(__dirname, "..", "commands", dir))
                    .filter((commandName) => !commandName.startsWith("_"))
                    .map((commandName) =>
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
    static async canUse(command, parameters, feedback = true) {
        if (command.private) {
            if (parameters.message.author.id != process.env.OWNER_ID) {
                return false;
            }
        }
        if (command.channelType) {
            const type = Array.isArray(command.channelType)
                ? command.channelType
                : [command.channelType];
            if (!type.includes(parameters.message.channel.type)) {
                return false;
            }
        }
        if (command.permissions) {
            if (
                !(await hasPermissions(
                    command.permissions.bot,
                    parameters.message.guild && parameters.message.guild.me,
                    parameters.message.channel,
                    feedback
                )) ||
                !(await hasPermissions(
                    command.permissions.member,
                    parameters.message.member,
                    parameters.message.channel,
                    feedback
                ))
            ) {
                return false;
            }
        }
        return true;
    }
    static async evaluate(command, parameters) {
        if (command.ready) {
            if (command.subcommands) {
                parameters.extend();
                if (
                    parameters.command.name &&
                    command.subcommands.hasOwnProperty(parameters.command.name)
                ) {
                    return this.evaluate(
                        command.subcommands[parameters.command.name],
                        parameters
                    );
                }
                parameters.fallback();
            }
            if (!(await this.canUse(command, parameters))) {
                return;
            }
            try {
                await Promise.resolve(command.execute(parameters));
            } catch (e) {
                // This is going to be changed later
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
                            "```",
                    },
                });
            }
        }
    }
}

module.exports = CommandManager;
