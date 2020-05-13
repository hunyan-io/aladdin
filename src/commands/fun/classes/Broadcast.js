const EMPTY = {
    content: String.fromCharCode(173),
    embed: null,
};

class BroadcastChannel {
    constructor(channel) {
        this.channel = channel;
        this.messages = [];
    }
    send(msg, cache = true) {
        return this.channel.send(msg).then((message) => {
            if (cache) {
                this.messages.push(message);
            }
            return message;
        });
    }
}

class Broadcast {
    constructor(channels = []) {
        this.channels = [...channels].map(
            (channel) => new BroadcastChannel(channel)
        );
    }
    add(channel) {
        if (
            !this.channels.find(
                (broadcastChannel) => broadcastChannel.channel.id == channel.id
            )
        ) {
            this.channels.push(new BroadcastChannel(channel));
        }
    }
    reserve(n) {
        const promises = [];
        for (let i = 0; i < n; i++) {
            promises.push(this.send(EMPTY));
        }
        return Promise.all(promises);
    }
    send(message, cache = true) {
        const promises = [];
        for (const channel of this.channels) {
            promises.push(channel.send(message || EMPTY, cache));
        }
        return Promise.all(promises);
    }
    edit(pos, message = EMPTY) {
        const promises = [];
        for (const channel of this.channels) {
            if (channel.messages[pos]) {
                promises.push(channel.messages[pos].edit(message));
            } else {
                promises.push(
                    channel.send(message, false).then((msg) => {
                        channel.messages[pos] = msg;
                    })
                );
            }
        }
        return Promise.all(promises);
    }
    clearAll(type = {}) {
        if (!type.exclude && !type.include) {
            type.exclude = [];
        }
        const promises = [];
        if (type.exclude) {
            for (let pos = 0; pos < this.channels[0].messages.length; pos++) {
                if (type.exclude.includes(pos)) continue;
                if (this.isEmpty(pos)) continue;
                promises.push(this.edit(pos, EMPTY));
            }
        } else if (type.include) {
            for (const pos of type.include) {
                if (this.isEmpty(pos)) continue;
                promises.push(this.edit(pos, EMPTY));
            }
        }
        return Promise.all(promises);
    }
    reduce(pos) {
        for (const channel of this.channels) {
            for (let i = 0; i < channel.messages.length; i++) {
                if (i === pos) continue;
                channel.messages[i].delete();
                delete channel.messages[i];
            }
            if (!isNaN(pos) && channel.messages[pos]) {
                channel.messages[0] = channel.messages[pos];
                delete channel.messages[pos];
            }
        }
    }
    isEmpty(pos) {
        for (const channel of this.channels) {
            const msg = channel.messages[pos];
            if (!msg || msg.content != EMPTY.content) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Broadcast;
