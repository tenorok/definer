const fs = require('fs'),
    path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    walk = require('walk'),
    _ = require('underscore');

function Maker() {

    /**
     * Отсортированные по зависимостям модули
     * @type {Object[]}
     */
    this.modules = [];

    /**
     * Имена добавленных в отсортированный массив модулей
     * @type {String[]}
     */
    this.sortedModuleNames = [];
}

Maker.prototype = {

    /**
     * Рекурсивно получить список всех файлов в директории
     * @param {String} directory Путь до стартовой директории
     * @param {String} [postfix] Постфикс искомых файлов
     * @returns {Promise}
     */
    getFileList: function(directory, postfix) {
        var promise = vow.promise(),
            walker = walk.walk(directory, { followLinks: false }),
            filelist = [];

        walker.on('file', function(root, stat, next) {

            var fileName = stat.name;
            if(this.isValidFilePostfix(fileName, postfix)) {
                filelist.push(path.join(root, stat.name));
            }

            next();
        }.bind(this));

        walker.on('end', function() {
            promise.fulfill(filelist);
        });

        return promise;
    },

    /**
     * Проверить, соответствует ли постфикс файлу
     * @param {String} fileName Имя файла
     * @param {String} postfix Постфикс
     * @returns {boolean}
     */
    isValidFilePostfix: function(fileName, postfix) {
        if(!postfix) return true;

        var fileParts = fileName.split('.');
        fileParts.shift();

        return new RegExp(postfix + '$').test(fileParts.join('.'));
    },

    /**
     * Открыть файл
     * @param {String} filePath Путь до файла
     * @returns {Promise}
     */
    openFile: function(filePath) {
        var promise = vow.promise();
        fs.readFile(filePath, { encoding: 'UTF-8' }, function(err, data) {
            if(err) return promise.reject(err);
            promise.fulfill(data);
        });
        return promise;
    },

    /**
     * Получить находящиеся в файле модули
     * @param {String} fileContent Содержимое файла
     * @returns {Object|null} Объект модулей файла или null при их отсутствии
     */
    getFileModules: function(fileContent) {
        var modules = {};
        vm.runInNewContext(fileContent, {
            define: function(name, body) {
                modules[name] = {
                    dependencies: this.getArguments(body),
                    body: body
                };
            }.bind(this)
        });
        return Object.keys(modules).length ? modules : null;
    },

    /**
     * Получить массив имён параметров тела модуля
     * @returns {String[]}
     */
    getArguments: function(body) {
        var fnStr = body.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
        var args = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
        return args || [];
    },

    /**
     * Получить все модули для сборки
     * @param {String} directory Путь до стартовой директории
     * @param {String} [postfix] Постфикс искомых файлов
     * @returns {Promise}
     */
    getModuleList: function(directory, postfix) {

        var promise = vow.promise(),
            modules = {};

        this.getFileList(directory, postfix || 'js').then(function(fileList) {
            fileList.forEach(function(filePath, index) {
                this.openFile(filePath).then(function(fileContent) {
                    modules = _.extend(modules, this.getFileModules(fileContent));
                    if(index + 1 >= fileList.length) { // Если последний файл
                        promise.fulfill(modules);
                    }
                }.bind(this));
            }.bind(this));
        }.bind(this));

        return promise;
    },

    /**
     * Получить отсортированные по зависимостям модули
     * @param {String} directory Путь до стартовой директории
     * @param {String} [postfix] Постфикс искомых файлов
     * @returns {Promise}
     */
    getModules: function(directory, postfix) {

        var promise = vow.promise();

        this.getModuleList(directory, postfix).then(function(modules) {
            promise.fulfill(this.sortModules(modules));
        }.bind(this));

        return promise;
    },

    /**
     * Получить отсортированные модули для конкретного модуля
     * @param {String} name Имя целевого модуля
     * @param {String} directory Путь до стартовой директории
     * @param {String} [postfix] Постфикс искомых файлов
     * @returns {Promise}
     */
    getModule: function(name, directory, postfix) {

        var promise = vow.promise();

        this.getModules(directory, postfix).then(function(modules) {
            promise.fulfill(modules.splice(0, this.getModuleIndex(name) + 1));
        }.bind(this));

        return promise;
    },

    /**
     * Сформировать строку замыкания из отсортированного списка модулей
     * @returns {String}
     */
    convertToClosure: function() {

        var length = this.modules.length,
            closure = ['(function(global) {\nvar '];

        this.modules.forEach(function(module, index) {
            closure.push(module.name);
            closure.push(' = (');
            closure.push(module.body);
            closure.push(').call(global');

            var deps = module.deps.join(', ');
            deps.length && closure.push(', ');
            closure.push(deps);

            closure.push(')');

            index + 1 < length
                ? closure.push(',')
                : closure.push(';');

            closure.push('\n');
        });

        closure.push('})(this);');

        return closure.join('');
    },

    /**
     * Отсортировать полученный список всех модулей для сборки
     * @param {Object} modules Список всех модулей
     * @returns {Object[]}
     */
    sortModules: function(modules) {

        for(var name in modules) if(modules.hasOwnProperty(name)) {

            var info = modules[name],
                dependencies = info.dependencies;

            if(!this.isModuleExist(name)) {

                dependencies.forEach(function(dependency) {
                    this.addModule('push', dependency, modules[dependency]);
                }.bind(this));

                this.addModule('push', name, info);

            } else {

                dependencies.forEach(function(dependency) {
                    this.moveBefore(name, dependency, info);
                }.bind(this));

            }
        }

        return this.modules;
    },

    /**
     * Добавить модуль в отсортированный массив
     * @param {String} method Метод для работы с массивом
     * @param {String} name Имя модуля
     * @param {Object} info Информация о модуле
     * @param {String[]} info.dependencies Зависимости модуля
     * @param {Function} info.body Тело модуля
     */
    addModule: function(method, name, info) {
        if(this.isModuleExist(name)) return;

        this.modules[method]({
            name: name,
            deps: info.dependencies,
            body: info.body
        });

        this.sortedModuleNames.push(name);
    },

    /**
     * Добавлен ли уже модуль в отсортированный массив
     * @param {String} name Имя модуля
     * @returns {boolean}
     */
    isModuleExist: function(name) {
        return !!~this.sortedModuleNames.indexOf(name);
    },

    /**
     * Расположить один модуль перед другим
     * @param {String} name Имя основного модуля, перед которым будет располагаться модуль-зависимость
     * @param {String} dependency Имя модуля-зависимости
     * @param {Object} info Информация о модуле
     * @param {String[]} info.dependencies Зависимости модуля
     * @param {Function} info.body Тело модуля
     * @returns {*}
     */
    moveBefore: function(name, dependency, info) {

        // Если модуля-зависимости ещё нет в сортируемом массиве
        if(!this.isModuleExist(dependency)) {
            return this.addModule('unshift', dependency, info);
        }

        var moduleIndex = this.getModuleIndex(name),
            dependencyIndex = this.getModuleIndex(dependency);

        // Если модуль-зависимость и так расположен перед основным модулем
        if(dependencyIndex < moduleIndex) return;

        this.moveBeforeIndex(moduleIndex, dependencyIndex);
    },

    /**
     * Получить индекс модуля в сортируемом массиве
     * @param {String} name Имя модуля
     * @returns {number}
     */
    getModuleIndex: function(name) {
        var moduleIndex;
        this.modules.every(function(module, index) {
            moduleIndex = index;
            return module.name !== name;
        });
        return moduleIndex;
    },

    /**
     * Подвинуть модуль-зависимость перед основным модулем
     * @param {number} moduleIndex Индекс основного модуля
     * @param {number} dependencyIndex Индекс модуля-зависимости
     */
    moveBeforeIndex: function(moduleIndex, dependencyIndex) {
        this.modules.splice(moduleIndex, 0, this.modules[dependencyIndex]); // Скопировать на новое место
        this.modules.splice(dependencyIndex + 1, 1); // Удалить с прошлого места
    }

};

module.exports = Maker;
