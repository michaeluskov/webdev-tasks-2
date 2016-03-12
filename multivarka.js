'use strict';

const MONGO_CLIENT = require('mongodb').MongoClient;

var MultivarkaConnection = function (url) {
    this.__url = url;
    this.__collectionName = undefined;
    this.__query = {};
    this.__newFields = {};
    this.__positiveCallback = () => {};
    this.__errorCallback = () => {};
};

MultivarkaConnection.prototype.collection = function (collectionName) {
    this.__collectionName = collectionName;
    return this;
};

MultivarkaConnection.prototype.__addToQuery = function (fieldName, rule) {
    this.__query[fieldName] = rule;
    return this;
};

MultivarkaConnection.prototype.where = function (fieldName) {
    return new MultivarkaQueryPredicateMaker(fieldName, this.__addToQuery.bind(this));
};

MultivarkaConnection.prototype.set = function (key, value) {
    this.__newFields[key] = value;
    return this;
};

MultivarkaConnection.prototype.__createCallbacks = function (callback) {
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

MultivarkaConnection.prototype.find = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__findObjects;
    this.__connect();
};

MultivarkaConnection.prototype.remove = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__removeObjects;
    this.__connect();
};

MultivarkaConnection.prototype.update = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__updateObjects;
    this.__connect();
};

MultivarkaConnection.prototype.insert = function (document, callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__insertObject;
    this.__newFields = document;
    this.__connect();
};

MultivarkaConnection.prototype.__connect = function () {
    if (!this.__url) {
        return this.__errorCallback('Wrong URL');
    }
    MONGO_CLIENT.connect(this.__url, this.__createCollectionObject.bind(this));
};

MultivarkaConnection.prototype.__createCollectionObject = function (err, db) {
    if (err) {
        return this.__errorCallback(err);
    }
    if (!this.__collectionName) {
        return this.__errorCallback('Wrong collection name');
    }
    this.__db = db;
    db.collection(this.__collectionName, this.__neededFunction.bind(this));
};

MultivarkaConnection.prototype.__findObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.find(this.__query).toArray(this.__returnResults.bind(this));
};

MultivarkaConnection.prototype.__removeObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.remove(this.__query, this.__returnOK.bind(this));
};

MultivarkaConnection.prototype.__updateObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.updateMany(this.__query, {$set: this.__newFields}, this.__returnOK.bind(this));
};

MultivarkaConnection.prototype.__insertObject = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.insert(this.__newFields, this.__returnOK.bind(this));
};

MultivarkaConnection.prototype.__returnOK = function (err) {
    if (err) {
        return this.__errorCallback(err);
    }
    this.__db.close();
    return this.__positiveCallback('OK');
};

MultivarkaConnection.prototype.__returnResults = function (err, data) {
    if (err) {
        return this.__errorCallback(err);
    }
    this.__db.close();
    return this.__positiveCallback(data);
};

var MultivarkaQueryPredicateMaker = function (fieldName, callback) {
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

MultivarkaQueryPredicateMaker.prototype.equal = __generateQuerySelector('$eq', '$ne');
MultivarkaQueryPredicateMaker.prototype.greatThan = __generateQuerySelector('$gt', '$lte');
MultivarkaQueryPredicateMaker.prototype.lessThan = __generateQuerySelector('$lt', '$gte');
MultivarkaQueryPredicateMaker.prototype.include = __generateQuerySelector('$in', '$nin');

MultivarkaQueryPredicateMaker.prototype.not = function () {
    this.__inversed ^= 1;
    return this;
};

exports.server = function (url) {
    return new MultivarkaConnection(url);
};
