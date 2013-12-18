(function(global) {

    /**
     * Конструктор
     * @constructor
     * @name Definer
     * @param {String} name Имя модуля
     * @param {Function} body Тело модуля
     */
    function Definer(name, body) {

        this.name = name;
        this.body = body;

        this.toPool();
    }

    /**
     * Объект для хранения всех объявленных модулей
     * @type {Object}
     */
    Definer.pool = {};

    Definer.prototype = {

        /**
         * Добавить модуль в объект для хранения всех объявленных модулей
         */
        toPool: function() {
            Definer.pool[this.name] = {
                body: this.body
            };
        },

        /**
         * Получить массив имён параметров тела модуля
         * @returns {String[]}
         */
        getArguments: function() {
            var fnStr = this.body.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
            var args = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
            return this.arguments = args || [];
        },

        /**
         * Получить массив зависимостей в виде выполненных тел модулей
         * @returns {Array}
         */
        getDependencies: function() {
            var dependencies = [];
            this.getArguments().forEach(function(argument) {
                dependencies.push(this.getDependency(argument));
            }, this);
            return dependencies;
        },

        /**
         * Получить выполненное тело зависимости
         * @param {String} name Имя зависимости
         * @returns {*}
         */
        getDependency: function(name) {
            var dependency = Definer.pool[name];
            if(!dependency) {
                this.throwDependency(name);
            }
            return dependency.export;
        },

        /**
         * Сообщить об отсутствии подключаемой зависимости
         * @param {String} name Имя зависимости
         */
        throwDependency: function(name) {
            throw new ReferenceError('module ' + name + ' is not defined');
        },

        /**
         * Выполнить тело модуля
         * @returns {*}
         */
        define: function() {
            return Definer.pool[this.name].export = this.body.apply(global, this.getDependencies());
        }

    };

    /**
     * Задекларировать модуль
     * @param {String} name Имя модуля
     * @param {Function} body Тело модуля
     * @returns {*}
     */
    global.define = function(name, body) {
        return new Definer(name, body).define();
    };

})(this);