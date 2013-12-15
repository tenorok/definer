const _ = require('underscore'),
    clicolor = require('cli-color');

/**
 * Класс логгирования сообщений
 * @constructor
 * @param {Object} [colors] Цвета для вывода сообщений
 */
function Logger(colors) {

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
     * @param {String} title Заголовок
     * @param {Array} message Строки сообщения
     */
    error: function(title, message) {
        this.print('error', title, message);
    },

    /**
     * Напечатать сообщение
     * @param {String} type Тип сообщения
     * @param {String} title Заголовок
     * @param {Array} message Строки сообщения
     */
    print: function(type, title, message) {

        // Если заголовок не передан
        if(_.isArray(title)) {
            message = title;
            title = type.charAt(0).toUpperCase() + type.slice(1);
        }

        console.log.apply(this, [clicolor[this.colors[type]](title + ':')].concat(message));
    }

};

module.exports = Logger;
