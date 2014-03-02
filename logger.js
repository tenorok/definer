const _ = require('underscore'),
    clicolor = require('cli-color'),
    moment = require('moment');

/**
 * Класс логгирования сообщений
 * @constructor
 * @param {Array} [types] Разрешённые типы вывода сообщений
 * @param {Object} [colors] Цвета для вывода сообщений
 */
function Logger(types, colors) {

    /**
     * Разрешённые типы вывода сообщений
     * @type {Array}
     */
    this.types = types || [];

    /**
     * Цвета для вывода сообщений
     * @type {Object}
     */
    this.colors = _.defaults(colors || {}, {
        log: 'blueBright',
        info: 'green',
        warn: 'yellow',
        error: 'red'
    });
}

Logger.prototype = {

    /**
     * Разрешён ли тип сообщения к выводу
     * @param {String} type Тип сообщения
     * @returns {boolean}
     */
    isAccessMode: function(type) {

        // Если не указан ни один режим, то они все разрешены
        if(!this.types.length) return true;

        return !!~this.types.indexOf(type);
    },

    /**
     * Вывести логирующее сообщение
     * @param {String} title Заголовок
     * @param {Array} message Строки сообщения
     */
    log: function(title, message) {
        this.print('log', title, message);
    },

    /**
     * Вывести информационное сообщение
     * @param {String} title Заголовок
     * @param {Array} message Строки сообщения
     */
    info: function(title, message) {
        this.print('info', title, message);
    },

    /**
     * Вывести предупреждающее сообщение
     * @param {String} title Заголовок
     * @param {Array} message Строки сообщения
     */
    warn: function(title, message) {
        this.print('warn', title, message);
    },

    /**
     * Вывести сообщение об ошибки
     * @param {Object} info Информация для вывода
     */
    error: function(info) {
        this.print('error', info);
    },

    /**
     * Начать отсчёт и вывести соответствующее уведомление
     * @returns {Logger}
     */
    start: function() {
        this.timeStart = moment();
        this.print('log', { text: 'build started' });
        return this;
    },

    /**
     * Завершить отсчёт и вывести время с начала отсчёта
     * @returns {Logger}
     */
    finish: function() {
        this.print('log', {
            text: 'build finished -',
            total: moment() - this.timeStart
        });
        return this;
    },

    /**
     * Напечатать сообщение
     * @param {String} type Тип сообщения
     * @param {String} title Заголовок
     * @param {Array} message Строки сообщения
     */
    print: function(type, title, message) {
        if(!this.isAccessMode(type)) return;

        // Если заголовок не передан
        if(Array.isArray(title)) {
            message = title;
            title = type.charAt(0).toUpperCase() + type.slice(1);
        }

        console.log.apply(this, [clicolor[this.colors[type]](title + ':')].concat(message));
    }

};

module.exports = Logger;
