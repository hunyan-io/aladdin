const Command = require("../../core/Command");
const CommandManager = require("../../core/CommandManager");
const Colors = require("../../enums/Colors");
const { splitMessage } = require("../../utils/Splitter");

const EMPTY_CHARACTER = String.fromCharCode(173);

module.exports = new Command({
    name: "help",
    aliases: ["commands", "command"],
    description: {
        general: "Shows command list or help about a specific command.",
        detailed:
            "Shows command list if no arguments were provided.\nOtherwise, shows detailed information about a specific command or subcommand.",
    },
    arguments: [
        {
            name: "command_name",
            description: "The name of the command or subcommand.",
            optional: true,
        },
    ],
    examples: ["{{command}}", "{{command}} exec", "{{command}} exec js"],
    async fieldsFilter(commands, parameters, subcmd) {
        const fields = [];
        for (const command of new Set(commands)) {
            if (
                !command.hidden &&
                (await CommandManager.canUse(command, parameters, false))
            ) {
                fields.push({
                    name: `:low_brightness: **\`${
                        subcmd ? "" : parameters.prefix
                    }${command.name}\`**`,
                    value:
                        (EMPTY_CHARACTER + " ").repeat(6) +
                        command.description.general,
                    inline: subcmd,
                });
            }
        }
        return fields;
    },
    async execute(parameters) {
        let commands = parameters.command.content.split(/\s+/);
        if (!commands[0].length) {
            splitMessage({
                embed: {
                    title: "Command List",
                    color: Colors.PRIMARY,
                    fields: await this.fieldsFilter(
                        Object.values(this.commands),
                        parameters,
                        false
                    ),
                },
            }).forEach((msg) => parameters.message.channel.send(msg));
            return;
        }
        commands = commands.map((cmdName) => cmdName.toLowerCase());

        const commandName = commands.join(" ");

        let command = { subcommands: this.commands };
        for (const cmdName of commands) {
            if (
                !command.subcommands ||
                !command.subcommands.hasOwnProperty(cmdName)
            ) {
                throw new Error(`Command \`${commandName}\` does not exist.`);
            }
            command = command.subcommands[cmdName];
        }

        let description = command.description.detailed;
        let fields;

        if (command.aliases.length) {
            const superCmd = [...commands];
            const usedAlias = superCmd.pop();
            let superName = superCmd.join(" ");
            if (superName) superName += " ";
            description +=
                "\n\n**Aliases:** " +
                command.aliases
                    .map(
                        (alias) =>
                            `\`${superName}${
                                alias == usedAlias ? command.name : alias
                            }\``
                    )
                    .join(", ");
        }
        if (command.arguments) {
            description +=
                "\n\n**Arguments:**\n" +
                command.arguments
                    .map(
                        (arg) =>
                            `\`${arg.name}\`: ${
                                arg.optional ? "(Optional) " : ""
                            }${arg.description}`
                    )
                    .join("\n");
        }
        if (command.examples) {
            description +=
                "\n\n**Example:**\n" +
                command.examples
                    .map((exp) =>
                        exp.replace(/{{(.*?)}}/g, (_, key) => {
                            if (key == "command") {
                                return parameters.prefix + commandName;
                            } else if (key == "command_name") {
                                return commandName;
                            } else if (key == "prefix") {
                                return parameters.prefix;
                            } else if (key == "author") {
                                return parameters.message.author;
                            }
                        })
                    )
                    .join("\n\n");
        }
        if (
            command.subcommands &&
            Object.values(command.subcommands).some((subcmd) => !subcmd.hidden)
        ) {
            description += "\n\n**Subcommands:**";
            fields = await this.fieldsFilter(
                Object.values(command.subcommands),
                parameters,
                true
            );
        }

        splitMessage({
            embed: {
                title: `Command \`${commandName}\``,
                color: Colors.PRIMARY,
                description,
                fields,
            },
        }).forEach((msg) => parameters.message.channel.send(msg));
    },
});
