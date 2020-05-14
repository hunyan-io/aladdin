const Command = require("../../core/Command");
const UBW = require("./games/UBW").gameClass;

module.exports = new Command({
    name: "throw",
    description: "Throw from 1 up to 3 blades in UBW.",
    hidden: true,
    execute({ message, command }) {
        if (
            !message.author.game ||
            !message.author.game instanceof UBW ||
            message.author.game.turn.user.id !== message.author.id
        )
            return;

        message.author.game.throw(command.content);
    },
});
