'use strict';

const MONGO_CLIENT = require('mongodb').MongoClient;


/**
 * ������, �������� ���� ������ � ��
 * @constructor
 * @param {string} dbString - URL ��
 * @param {string} collectionName - �������� ���������
 * @param {object} params - ��������� �������
 * @param {object} methodParams - ��������� ������
 * @param {booleam} needToTransformToArray - ���������� �� ��������� ������ � ������� 
 * @param {function} callback - Callback
 */
var MongoQuery = function (dbString, collectionName, method, params, methodParams, needToTransformToArray, callback) {
    this.__dbString = dbString;
    this.__collectionName = collectionName;
    this.__method = method;
    this.__params = params;
    this.__methodParams = methodParams;
    this.__needToTransformToArray = needToTransformToArray;
    this.__callback = callback;
    this.__db = null;
    this.__collection = null;
};

/**
 * ����� �������
 */
MongoQuery.prototype.start = function () {
    try {
        MONGO_CLIENT.connect(this.__dbString,
        this.__createCollectionObject.bind(this));
    } catch (e) {
        return this.__callback(e);
    }
};

/**
 * ������� ����������� � ������� ������� � �������
 * @private
 * @param {object} err - ������
 */
MongoQuery.prototype.__closeOnErrorAndCallback = function (err) {
    this.__db && this.__db.close();
    this.__callback(err);
};

/**
 * �������� ���������
 * @private
 * @param {object} err - ������
 * @param {object} db - ��
 */
MongoQuery.prototype.__createCollectionObject = function (err, db) {
    if (err) {
        return this.__closeOnErrorAndCallback(err);
    }
    this.__db = db;
    db.collection(this.__collectionName, this.__performOperation.bind(this));
};

/**
 * ��������� ������
 * @private
 * @param {object} err - ������
 * @param {object} collection - ���������
 */
MongoQuery.prototype.__performOperation = function (err, collection) {
    if (err) {
        return this.__closeOnErrorAndCallback(err);
    }
    this.__collection = collection;
    if (this.__needToTransformToArray) {
        collection[this.__method](this.__params)
            .toArray(this.__returnResults.bind(this));
    } else if (this.__methodParams) {
        collection[this.__method](this.__params, this.__methodParams,
            this.__returnResults.bind(this));
    } else {
        collection[this.__method](this.__params, this.__returnResults.bind(this));
    }
};

/**
 * ������� ����������
 * @private
 * @param {object} err - ������
 * @param {object} data - ������
 */
MongoQuery.prototype.__returnResults = function (err, data) {
    this.__db.close();
    return this.__callback(err, data);
};

module.exports = MongoQuery;
