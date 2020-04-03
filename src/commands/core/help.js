const Command = require("../../core/Command");
const Colors = require("../../enums/Colors");
const { splitMessage } = require("../../utils/splitter");

const EMPTY_CHARACTER = String.fromCharCode(173);

module.exports = new Command({
    name: "help",
    aliases: ["commands"],
    description: "Shows command list or help about a specific command.",
    init() {
        this.fields = [...new Set(Object.values(this.commands))].map(
            command => ({
                name: command.name,
                value:
                    (EMPTY_CHARACTER + " ").repeat(6) +
                    (command.description ||
                        "This command doesn't have a description yet.")
            })
        );
    },
    execute({ message, guildData, prefix }) {
        splitMessage({
            embed: {
                title: "Command List",
                color: Colors.PRIMARY,
                fields: this.fields.map(field => ({
                    name: `:low_brightness: **\`${prefix}${field.name}\`**`,
                    value: field.value,
                    inline: false
                }))
            }
        }).forEach(msg => message.channel.send(msg));
    }
});
