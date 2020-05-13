const EventEmitter = require("events");

function timeout(off, cb, options) {
    return setTimeout(() => {
        off(cb);
        if (options.onTimeout) {
            options.onTimeout();
        }
    }, options.timeout);
}

class EventTimeout extends EventEmitter {
    on(event, callback, options) {
        if (!options || !options.timeout) return super.on(event, callback);
        const off = (cb) => super.off(event, cb);
        if (options.refresh) {
            let timer;
            callback.refresh = (...args) => {
                clearTimeout(timer);
                callback(...args);
                timer = timeout(off, callback.refresh, options);
            };
            super.on(event, callback.refresh);
            timer = timeout(off, callback.refresh, options);
        } else {
            super.on(event, callback);
            timeout(off, callback, options);
        }
        return this;
    }
    off(event, callback) {
        return super.off(event, callback.refresh || callback);
    }
}

module.exports = EventTimeout;
