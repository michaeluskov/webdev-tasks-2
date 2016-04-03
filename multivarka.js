'use strict';

const MONGO_CLIENT = require('mongodb').MongoClient;
const MongoQuery = require('./mongoquery.js');

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
    this.__callback = function () {};
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
 * Очистка данных в мультиварке
 * @private
 */
MultivarkaConnection.prototype.__eraseDataInMultivarka = function () {
    this.__query = {};
    this.__newFields = {};
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
 * Поиск подходящих документов
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.find = function (callback) {
    var query = new MongoQuery(this.__url, 
        this.__collectionName, 
        'find', 
        this.__query,
        null,
        true,
        callback);
    this.__eraseDataInMultivarka();
    query.start();
};

/**
 * Удаление подходящих документов
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.remove = function (callback) {
    var query = new MongoQuery(this.__url, 
        this.__collectionName, 
        'remove', 
        this.__query,
        null,
        false,
        callback);
    this.__eraseDataInMultivarka();
    query.start();
};

/**
 * Обновление подходящих документов
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.update = function (callback) {
    var query = new MongoQuery(this.__url, 
        this.__collectionName, 
        'update', 
        this.__query,
        {$set: this.__newFields},
        false,
        callback);
    this.__eraseDataInMultivarka();
    query.start();
};

/**
 * Создание нового документа
 * @param {object} document - Документ
 * @param {function} callback - Изначальный коллбэк
 */
MultivarkaConnection.prototype.insert = function (document, callback) {
    var query = new MongoQuery(this.__url, 
        this.__collectionName, 
        'insert', 
        document,
        null,
        false,
        callback);
    this.__eraseDataInMultivarka();
    query.start();
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

/**
 * Генерация предиката равенства
 * @param {any} value - Значение
 */
MultivarkaQueryPredicateMaker.prototype.equal = __generateQuerySelector('$eq', '$ne');

/**
 * Генерация предиката "больше"
 * @param {any} value - Значение
 */
MultivarkaQueryPredicateMaker.prototype.greatThan = __generateQuerySelector('$gt', '$lte');

/**
 * Генерация предиката "меньше"
 * @param {any} value - Значение
 */
MultivarkaQueryPredicateMaker.prototype.lessThan = __generateQuerySelector('$lt', '$gte');

/**
 * Генерация предиката включения
 * @param {any} value - Значение
 */
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
