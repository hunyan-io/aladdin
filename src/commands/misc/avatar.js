const Command = require("../../core/Command");
const Colors = require("../../enums/Colors");

module.exports = new Command({
    name: "avatar",
    description: "Shows the avatar of a user in a given size.",
    execute({ message }) {
        const user = message.mentions.users.first() || message.author;
        message.respond({
            embed: {
                title: `${user.username}'s avatar`,
                color: Colors.PRIMARY,
                image: {
                    url: user.displayAvatarURL({ dynamic: true, size: 512 }),
                },
            },
        });
    },
});
