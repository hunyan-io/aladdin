const GuildData = require("./GuildData");

class MessageCommand {
    constructor(name, content, parent = null) {
        this.name = name.toLowerCase();
        this.content = content;
        this.super = parent;
    }
    get nameList() {
        let names = [this.name];
        let parent = this.super;

        while (parent) {
            names.unshift(parent.name);
            parent = parent.super;
        }

        return names;
    }
    get fullname() {
        return this.nameList.join(" ");
    }
}

class CommandParameters {
    constructor(message) {
        this.message = message;
        this.guildData = null;
        this.prefix = null;
        this.command = null;
    }
    static async from(message) {
        const _this = new this(message);
        _this.guildData =
            message.guild && (await GuildData.from(message.guild));
        _this.prefix =
            (_this.guildData && _this.guildData.prefix) || process.env.PREFIX;

        // Not going to handle errors here, this only get called after a CommandManager.isCommand check
        const [, cmd, content] = message.content
            .slice(_this.prefix.length)
            .match(/^(\S*)\s*(.*)$/s);

        _this.command = new MessageCommand(cmd, content);

        return _this;
    }
    extend() {
        // Parse subcommand
        const [, subcmd, subcontent] = this.command.content.match(
            /^(\S*)\s*(.*)$/s
        );

        this.command = new MessageCommand(subcmd, subcontent, this.command);
    }
    fallback() {
        // Fallback to supercommand in case subcommand did not exist

        if (!this.command.super) {
            // Debug
            throw new Error(
                `Called fallback on top level command ${this.command.name}`
            );

            //return;
        }

        this.command = this.command.super;
    }
}

module.exports = CommandParameters;
