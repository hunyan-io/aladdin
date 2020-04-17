const Command = require("../../core/Command");
const {
    Permissions: { FLAGS: PERMISSIONS },
} = require("discord.js");

module.exports = new Command({
    name: "prefix",
    description: "Sets the prefix for this server.",
    permissions: {
        bot: [],
        member: [PERMISSIONS.MANAGE_GUILD],
    },
    execute({ message: { channel } }) {
        channel.send("test");
    },
});
