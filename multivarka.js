'use strict';

const MONGO_CLIENT = require('mongodb').MongoClient;

/**
 * Коннектор к базе данных
 * @constructor
 * @param {string} url - URL БД
 */
var MultivarkaConnection = function (url) {
    this.__url = url;
    this.__collectionName = undefined;
    this.__query = {};
    this.__newFields = {};
    this.__positiveCallback = () => {};
    this.__errorCallback = () => {};
};

/**
 * Выбор коллекции
 * @param {string} collectionName - Название коллекции
 * @return {MultivarkaConnection} - Подключение
 */
MultivarkaConnection.prototype.collection = function (collectionName) {
    this.__collectionName = collectionName;
    return this;
};

/**
 * Добавление предиката в запрос
 * @private
 * @param {string} fieldName - Название поля
 * @param {object} rule - Правило
 * @return {MultivarkaConnection} - Подключение
 */
MultivarkaConnection.prototype.__addToQuery = function (fieldName, rule) {
    this.__query[fieldName] = rule;
    return this;
};

/**
 * Получение создателя предиката
 * @param {string} fieldName - Название поля
 * @return {MultivarkaQueryPredicateMaker} - Создатель предиката
 */
MultivarkaConnection.prototype.where = function (fieldName) {
    return new MultivarkaQueryPredicateMaker(fieldName, this.__addToQuery.bind(this));
};

/**
 * Добавление нового значения для поля
 * @param {string} key - Название поля
 * @param {any} value - Новое значение
 * @return {MultivarkaConnection} - Подключение
 */
MultivarkaConnection.prototype.set = function (key, value) {
    this.__newFields[key] = value;
    return this;
};

/**
 * Создание коллбэков для позитивного и негативного исхода
 * @private
 * @param {function} callback - Изначальный коллбэк
 */
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

/**
 * Поиск подходящих документов
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.find = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__findObjects;
    this.__connect();
};

/**
 * Удаление подходящих документов
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.remove = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__removeObjects;
    this.__connect();
};

/**
 * Обновление подходящих документов
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.update = function (callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__updateObjects;
    this.__connect();
};

/**
 * Создание нового документа
 * @param {object} document - Документ
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.insert = function (document, callback) {
    this.__createCallbacks(callback);
    this.__neededFunction = this.__insertObject;
    this.__newFields = document;
    this.__connect();
};

/**
 * Соединение с БД
 * @private
 */
MultivarkaConnection.prototype.__connect = function () {
    if (!this.__url) {
        return this.__errorCallback('Wrong URL');
    }
    MONGO_CLIENT.connect(this.__url, this.__createCollectionObject.bind(this));
};

/**
 * Подключение к коллекции
 * @private
 * @param {object} err - Информация об ошибке
 * @param {object} db - Подключение к БД
 */
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

/**
 * Поиск документов
 * @private
 * @param {object} err - Информация об ошибке
 * @param {object} collection - Подключение к коллекции
 */
MultivarkaConnection.prototype.__findObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.find(this.__query).toArray(this.__returnResults.bind(this));
};

/**
 * Удаление документов
 * @private
 * @param {object} err - Информация об ошибке
 * @param {object} collection - Подключение к коллекции
 */
MultivarkaConnection.prototype.__removeObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.remove(this.__query, this.__returnOK.bind(this));
};


/**
 * Обновление документов
 * @private
 * @param {object} err - Информация об ошибке
 * @param {object} collection - Подключение к коллекции
 */
MultivarkaConnection.prototype.__updateObjects = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.updateMany(this.__query, {$set: this.__newFields}, this.__returnOK.bind(this));
};

/**
 * Добавление документа
 * @private
 * @param {object} err - Информация об ошибке
 * @param {object} collection - Подключение к коллекции
 */
MultivarkaConnection.prototype.__insertObject = function (err, collection) {
    if (err) {
        return this.__errorCallback(err);
    }
    collection.insert(this.__newFields, this.__returnOK.bind(this));
};

/**
 * Вызов коллбэка без данных
 * @private
 * @param {object} err - Информация об ошибке
 */
MultivarkaConnection.prototype.__returnOK = function (err) {
    if (err) {
        return this.__errorCallback(err);
    }
    this.__db.close();
    return this.__positiveCallback('OK');
};

/**
 * Вызов коллбэка с данными
 * @private
 * @param {object} err - Информация об ошибке
 * @param {any} data - Данные
 */
MultivarkaConnection.prototype.__returnResults = function (err, data) {
    if (err) {
        return this.__errorCallback(err);
    }
    this.__db.close();
    return this.__positiveCallback(data);
};

/**
 * Создание создателя предиката для запроса
 * @constructor
 * @param {object} fieldName - Название поля
 * @param {function} callback - Коллбэк
 */
var MultivarkaQueryPredicateMaker = function (fieldName, callback) {
    this.__fieldName = fieldName;
    this.__callback = callback;
    this.__inversed = 0;
};

/**
 * Генерация функции, создающей предикат
 * @param {string} selector - Позитивный селектор
 * @param {string} notSelector - Негативный селектор
 * @return {function} - Функция, создающая правило
 */
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

/**
 * Оповещение о том, что следующий селектор должен быть негативным
 * @return {MultivarkaQueryPredicateMaker} - Создатель предиката
 */
MultivarkaQueryPredicateMaker.prototype.not = function () {
    this.__inversed ^= 1;
    return this;
};

exports.server = function (url) {
    return new MultivarkaConnection(url);
};
