const CommandManager = require("./CommandManager");

class Command {
    constructor(command) {
        if (!command.name) {
            throw new Error("Missing command name.");
        }
        Object.assign(this, command);
        this.name = this.name.toLowerCase();
        this.aliases = this.aliases
            ? this.aliases.map(name => name.toLowerCase())
            : [];
        this.ready = false;
        this.subcommands = null;
    }
    extend(command) {
        if (command.constructor != this.constructor) {
            command = new this.constructor(command);
        }

        //make sure the extension's init method is executed after the base init method
        if (command.init) {
            const init = command.init.bind(command);
            const _this = this;
            if (this.init) {
                //in case a base init method already exists
                const _init = this.init.bind(this);
                this.init = async function() {
                    //make sure the base init method is called only once
                    delete _this.init;

                    //wait for the base init method execution
                    await Promise.resolve(_init());

                    //call the extension's init method
                    //return so that the command isn't ready until this async method is resolved
                    return init();
                };
            } else {
                //in case no base init method exists
                //add a base init method
                this.init = async function() {
                    //make sure the base init method is called only once
                    delete _this.init;

                    //call the extension's init method
                    return init();
                };
            }
        }
        //calling init on the extension will execute the base init method through the __proto__
        delete command.init;
        delete command.ready;
        command.__proto__ = this;

        return command;
    }
    subcommand(command) {
        if (command.__proto__ != this) {
            command = this.extend(command);
        }

        this.subcommands = this.subcommands || {};
        if (this.subcommands[command.name]) {
            throw new Error(
                `subcommand ${command.name} of command ${this.name} is duplicated.`
            );
        }
        this.subcommands[command.name] = command;
        for (const alias of command.aliases) {
            if (this.subcommands[alias]) {
                throw new Error(
                    `alias ${alias} of subcommand ${command.name} of command ${this.name} is duplicated.`
                );
            }
            this.subcommands[alias] = command;
        }

        //returns this and not the subcommand, to allow chaining
        return this;
    }
    get commands() {
        return CommandManager.commands;
    }
}

module.exports = Command;
