'use strict';

const MONGO_CLIENT = require('mongodb').MongoClient;

var MongoConnection = function (url) {
    this.__error = undefined;
    this.__url = url;
    this.__collectionName = undefined;
    this.__query = {};
    this.__newFields = {};
    this.__positiveCallback = () => {};
    this.__errorCallback = () => {};
};

MongoConnection.prototype.collection = function (collectionName) {
    this.__collectionName = collectionName;
    return this;
};

MongoConnection.prototype.__addToQuery = function (fieldName, rule) {
    this.__query[fieldName] = rule;
    return this;
};

MongoConnection.prototype.where = function (fieldName) {
    return new MongoQuery(fieldName, this.__addToQuery.bind(this));
};

MongoConnection.prototype.set = function (key, value) {
    this.__newFields[key] = value;
    return this;
};

MongoConnection.prototype.__createCallbacks = function (callback) {
    this.__positiveCallback = function (data) {
        callback(null, data);
    };
    this.__errorCallback = function (error) {
        if (this.__db) {
            this.__db.close();
        }
        callback(error);
    };
};

MongoConnection.prototype.find = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__findObjects;
    this.__connect();
};

MongoConnection.prototype.remove = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__removeObjects;
    this.__connect();
};

MongoConnection.prototype.update = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__updateObjects;
    this.__connect();
};

MongoConnection.prototype.insert = function (document, callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__insertObject;
    this.__newFields = document;
    this.__connect();
};

MongoConnection.prototype.__connect = function (callback) {
    if (!this.__url) {
        return this.__errorCallback('Wrong URL');
    }
    MONGO_CLIENT.connect(this.__url, this.__createCollectionObject.bind(this));
};

MongoConnection.prototype.__createCollectionObject = function (err, db) {
    if (err) {
        return this.__errorCallback(err);
    }
    if (!this.__collectionName) {
        return this.__errorCallback('Wrong collection name');
    }
    this.__db = db;
    db.collection(this.__collectionName, this.__neededFunction.bind(this));
};

MongoConnection.prototype.__findObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.find(this.__query).toArray(this.__returnResults.bind(this));
};

MongoConnection.prototype.__removeObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.remove(this.__query, this.__returnOK.bind(this));
};

MongoConnection.prototype.__updateObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.updateMany(this.__query, {$set: this.__newFields}, this.__returnOK.bind(this));
};

MongoConnection.prototype.__insertObject = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.insert(this.__newFields, this.__returnOK.bind(this));
};

MongoConnection.prototype.__returnOK = function (err, data) {
    if (err) {
        return this.__errorCallback(err);
    }
    this.__db.close();
    return this.__positiveCallback('OK');
};

MongoConnection.prototype.__returnResults = function (err, data) {
    if (err) {
        return this.__errorCallback(err);
    }
    this.__db.close();
    return this.__positiveCallback(data);
};

var MongoQuery = function (fieldName, callback) {
    this.__fieldName = fieldName;
    this.__callback = callback;
    this.__inversed = 0;
};

var __generateQuerySelector = function (selector, notSelector) {
    return function (value) {
        var query = {};
        query[this.__inversed ? notSelector : selector] = value;
        return this.__callback(this.__fieldName, query);
    };
};

MongoQuery.prototype.equals = __generateQuerySelector('$eq', '$ne');
MongoQuery.prototype.greatThan = __generateQuerySelector('$gt', '$lte');
MongoQuery.prototype.lessThan = __generateQuerySelector('$lt', '$gte');
MongoQuery.prototype.include = __generateQuerySelector('$in', '$nin');

MongoQuery.prototype.not = function () {
    this.__inversed ^= 1;
    return this;
};

exports.server = function (url) {
    return new MongoConnection(url);
};
