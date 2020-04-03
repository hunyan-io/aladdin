const mongomock = {};

mongomock.db = function() {
    return new Database();
};

class Database {
    constructor() {}
    collection() {
        return new Collection();
    }
}

class Collection {
    constructor() {}
    async findOne() {}
    async insertOne() {
        return {};
    }
}

module.exports = mongomock;
