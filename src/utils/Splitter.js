const EMPTY_CHARACTER = String.fromCharCode(173);

function splitString(str, maxLen) {
    const result = [];
    const evalMaxLen = typeof maxLen == "function";

    let accumulator = 0;
    while (accumulator != str.length) {
        const maxIndex =
            accumulator + (evalMaxLen ? maxLen(result.length) : maxLen);
        let splitContent;
        if (maxIndex < str.length) {
            splitContent = str.slice(
                accumulator,
                accumulator + (evalMaxLen ? maxLen(result.length) : maxLen)
            );
            let index = splitContent.lastIndexOf("\n");
            if (index <= 0) {
                index = splitContent.lastIndexOf(" ");
            }
            if (index > 0) {
                splitContent = splitContent.slice(0, index);
            }
        } else {
            splitContent = str.slice(accumulator);
        }
        accumulator += splitContent.length;
        result.push(splitContent);
    }

    return result;
}

function capString(str, maxLen) {
    return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}

function checkTotal(messages, length) {
    messages.embedTotal += length;
    if (messages.embedTotal > 6000 || messages.main.embed.fields.length > 25) {
        messages.embedTotal = length;
        const message = {
            embed: {
                color: messages.main.embed.color,
                fields: [],
                footer: messages.main.embed.footer,
                image: messages.main.embed.image,
                timestamp: messages.main.embed.timestamp
            }
        };
        messages.list.push(message);
        delete messages.main.embed.footer;
        delete messages.main.embed.image;
        delete messages.main.embed.timestamp;
        messages.main = message;
    }
}

function splitMessage(message) {
    if (typeof message == "string") {
        message = { content: message };
    }

    const messages = {
        list: [],
        main: message,
        embedTotal: 0
    };

    if (typeof message.content == "string") {
        messages.list = splitString(message.content, 2000).map(
            splitContent => ({
                content: splitContent
            })
        );
        messages.list[messages.list.length - 1] = Object.assign(
            message,
            messages.list[messages.list.length - 1]
        );
    } else {
        messages.list.push(message);
    }

    if (message.embed) {
        if (message.embed.author && message.embed.author.name) {
            message.embed.author.name = capString(
                message.embed.author.name,
                256
            );
            messages.embedTotal += message.embed.author.name.length;
        }

        if (typeof message.embed.title == "string") {
            message.embed.title = capString(message.embed.title, 256);
            messages.embedTotal += message.embed.title.length;
        }

        const fields = message.embed.fields;

        if (typeof message.embed.description == "string") {
            const split = splitString(message.embed.description, index =>
                index == 0 ? 2048 : 1024
            );
            message.embed.description = split.shift();
            messages.embedTotal += message.embed.description.length;

            message.embed.fields = [];
            for (const splitContent of split) {
                checkTotal(messages, splitContent.length + 1);
                messages.main.embed.fields.push({
                    name: EMPTY_CHARACTER,
                    value: splitContent,
                    inline: false
                });
            }
        }
        if (fields) {
            for (let i = 0; i < fields.length; i++) {
                fields[i].name = capString(fields[i].name, 256);
                if (fields[i].value.length > 1024) {
                    const splitFields = splitString(fields[i].value, 1024).map(
                        splitContent => ({
                            name: EMPTY_CHARACTER,
                            value: splitContent,
                            inline: false
                        })
                    );
                    splitFields[0].name = fields[i].name;
                    fields.splice(i, 1, ...splitFields);
                }
                checkTotal(
                    messages,
                    fields[i].name.length + fields[i].value.length
                );
                messages.main.embed.fields.push(fields[i]);
            }
        }

        if (messages.main.embed.footer && messages.main.embed.footer.text) {
            messages.main.embed.footer.text = capString(
                messages.main.embed.footer.text,
                2048
            );
            checkTotal(messages, messages.main.embed.footer.text.length);
        }
    }

    return messages.list;
}

module.exports = {
    splitString,
    splitMessage,
    test
};
