'use strict';

const MONGO_CLIENT = require('mongodb').MongoClient;


/**
 * Обьект, делающий один запрос к БД
 * @constructor
 * @param {string} dbString - URL БД
 * @param {string} collectionName - Название коллекции
 * @param {object} params - Параметры запроса
 * @param {object} methodParams - Параметры метода
 * @param {booleam} needToTransformToArray - Необходимо ли приводить запрос к массиву 
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
 * Старт запроса
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
 * Закрыть подключение и вызвать коллбэк с ошибкой
 * @private
 * @param {object} err - Ошибка
 */
MongoQuery.prototype.__closeOnErrorAndCallback = function (err) {
    this.__db && this.__db.close();
    this.__callback(err);
};

/**
 * Получить коллекцию
 * @private
 * @param {object} err - Ошибка
 * @param {object} db - БД
 */
MongoQuery.prototype.__createCollectionObject = function (err, db) {
    if (err) {
        return this.__closeOnErrorAndCallback(err);
    }
    this.__db = db;
    db.collection(this.__collectionName, this.__performOperation.bind(this));
};

/**
 * Выполнить запрос
 * @private
 * @param {object} err - Ошибка
 * @param {object} collection - Коллекция
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
 * Вернуть результаты
 * @private
 * @param {object} err - Ошибка
 * @param {object} data - Данные
 */
MongoQuery.prototype.__returnResults = function (err, data) {
    this.__db.close();
    return this.__callback(err, data);
};

module.exports = MongoQuery;
