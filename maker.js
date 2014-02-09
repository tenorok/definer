const path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    walk = require('walk'),
    fs = require('graceful-fs'),
    _ = require('underscore'),
    moment = require('moment'),

    Logger = require('./logger');

/**
 * Сборщик модульной системы Definer
 * @constructor
 * @param {Object} [options] Опции сборки
 */
function Maker(options) {

    /**
     * Отсортированные по зависимостям модули
     * @private
     * @type {Object[]}
     */
    this.modules = [];

    /**
     * Содержимое файлов очищенных модулей
     * @private
     * @type {String[]}
     */
    this.clean = [];

    /**
     * Имена добавленных в отсортированный массив модулей
     * @private
     * @type {String[]}
     */
    this.sortedModuleNames = [];

    /**
     * Модули для собираемого модуля
     * @private
     * @type {Object}
     */
    this.modulesToModule = {};

    /**
     * Строка замыкания из отсортированного списка модулей
     * @private
     * @type {String}
     */
    this.closure = '';

    /**
     * Путь до сохраняемого файла
     * @private
     * @type {String}
     */
    this.saveFilePath = '';

    /**
     * Опции сборки
     * @type {{
     * directory: String,
     * module: String|boolean,
     * postfix: String,
     * verbose: Array,
     * clean: Object,
     * jsdoc: Object
     * }}
     */
    this.options = _.defaults(options || {}, {
        directory: '.',
        module: false,
        postfix: 'js',
        verbose: [],
        clean: {},
        jsdoc: {}
    });

    /**
     * Экземпляр для логирования сборки
     * @private
     * @type {Logger}
     */
    this.console = new Logger(this.options.verbose);
}

Maker.prototype = {

    /**
     * Собрать модули
     * @param {String} filePath Путь до сохраняемого файла
     * @returns {Promise}
     */
    make: function(filePath) {

        this.saveFilePath = filePath;

        var promise = vow.promise();

        this.getModules()
            .then(this.getCleanFiles.bind(this))
            .then(function() {
                this.convertToClosure();
                this.saveClosureToFile().then(function(saved) {
                    promise.fulfill(saved);
                }).done();
            }.bind(this)).done();

        return promise;
    },

    /**
     * Рекурсивно получить список всех файлов в директории
     * @returns {Promise}
     */
    getFileList: function() {
        var promise = vow.promise(),
            walker = walk.walk(this.options.directory, { followLinks: false }),
            filelist = [];

        walker.on('file', function(root, stat, next) {

            var fileName = stat.name;
            if(this.isValidFilePostfix(fileName)) {
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
     * @private
     * @param {String} fileName Имя файла
     * @returns {boolean}
     */
    isValidFilePostfix: function(fileName) {

        var fileParts = fileName.split('.');
        fileParts.shift();

        return new RegExp(this.options.postfix + '$').test(fileParts.join('.'));
    },

    /**
     * Открыть файл
     * @private
     * @param {String} filePath Путь до файла
     * @returns {Promise}
     */
    openFile: function(filePath) {
        var promise = vow.promise();
        fs.readFile(filePath, { encoding: 'UTF-8' }, function(err, data) {
            if(err) this.console.error('Missed', [filePath]);
            promise.fulfill(data || '');
        }.bind(this));
        return promise;
    },

    /**
     * Колбек вызывается для каждого открытого файла в методе openFiles
     * @private
     * @callback Maker~openFilesCallback
     * @param {String} file Путь до файла
     * @param {String} data Содержимое файла
     */

    /**
     * Открыть список файлов
     * @private
     * @param {String[]} filesPath Пути до файлов
     * @param {Maker~openFilesCallback} [callback] Колбек вызывается для каждого файла
     * @returns {Promise}
     */
    openFiles: function(filesPath, callback) {

        var promises = [];

        filesPath.forEach(function(file) {

            var filePromise = this.openFile(file);
            promises.push(filePromise);

            filePromise.then(function(data) {
                callback && callback.call(this, file, data);
            }.bind(this)).done();

        }, this);

        return vow.all(promises);
    },

    /**
     * Открыть список файлов с сохранением порядка
     * @private
     * @param {String[]} filesPath Пути до файлов
     * @param {Maker~openFilesCallback} [callback] Колбек вызывается для каждого файла
     * @returns {Promise}
     */
    openFilesByOrder: function(filesPath, callback) {

        var promise = vow.promise(),
            filesContent = {};

        this
            .openFiles(filesPath, function(file, data) {
                filesContent[file] = data;
                callback && callback.call(this, file, data);
            })
            .then(function() {
                var filesByOrder = [];
                filesPath.forEach(function(file) {
                    filesByOrder.push(filesContent[file]);
                });
                promise.fulfill(filesByOrder);
            });

        return promise;
    },

    /**
     * Сохранить строку замыкания в файл
     * @private
     * @returns {Promise}
     */
    saveClosureToFile: function() {

        var promise = vow.promise();

        if(this.closure) {
            fs.writeFile(this.saveFilePath, this.closure, function(err) {
                if(err) return promise.reject(err);
                promise.fulfill(true);
            });
        } else {
            promise.fulfill(false);
        }

        return promise;
    },

    /**
     * Получить находящиеся в файле модули
     * @param {String} filePath Путь до файла
     * @param {String} fileContent Содержимое файла
     * @returns {Object|null} Объект модулей файла или null при их отсутствии
     */
    getFileModules: function(filePath, fileContent) {

        var modules = {};

        var definer = function(name, body) {
            modules[name] = {
                dependencies: this.getArguments(body),
                body: body
            };
            this.console.log('Include', [filePath, '\n         Module:', name]);
        }.bind(this);

        definer.clean = function(globals) {
            if(!Array.isArray(globals)) {
                globals = [globals];
            }

            globals.forEach(function(name) {
                modules[name] = {
                    dependencies: [],
                    clean: true
                };
                this.console.log('Clean', [filePath, '\n       Module:', name]);
            }, this);
        }.bind(this);

        try {
            vm.runInNewContext(fileContent, {
                definer: definer
            });
        } catch(e) {
            this.console.warn('Skipped', [filePath, '\n         ' + e]);
        }

        return Object.keys(modules).length ? modules : null;
    },

    /**
     * Получить массив имён параметров тела модуля
     * @private
     * @returns {String[]}
     */
    getArguments: function(body) {
        var fnStr = body.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
        var args = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
        return args || [];
    },

    /**
     * Получить все модули для сборки
     * @private
     * @returns {Promise}
     */
    getModuleList: function() {

        var promise = vow.promise(),
            modules = {};

        this.getFileList().then(function(fileList) {

            if(!fileList.length) {
                return promise.fulfill({});
            }

            this.openFiles(fileList, function(file, data) {
                modules = _.extend(modules, this.getFileModules(file, data));
            }).then(function() {
                promise.fulfill(modules);
            }).done();

        }.bind(this)).done();

        return promise;
    },

    /**
     * Получить все модули для собираемого модуля
     * @private
     * @returns {Promise}
     */
    getModuleListToModule: function() {

        var promise = vow.promise(),
            target = this.options.module;

        this.getModuleList().then(function(modules) {
            var modulesToTarget = this.getModulesByDependencies(target, modules);
            modulesToTarget[target] = modules[target];
            promise.fulfill(modulesToTarget);
        }.bind(this)).done();

        return promise;
    },

    /**
     * Получить список модулей по зависимостям
     * @private
     * @param {String} name Имя модуля
     * @param {Object} modules Все модули
     * @returns {Object}
     */
    getModulesByDependencies: function(name, modules) {

        modules[name].dependencies.forEach(function(dependency) {
            this.modulesToModule[dependency] = modules[dependency];
            this.getModulesByDependencies(dependency, modules);
        }, this);

        return this.modulesToModule;
    },

    /**
     * Получить отсортированные по зависимостям модули
     * @returns {Promise}
     */
    getModules: function() {

        var promise = vow.promise(),
            method = this.options.module ? 'getModuleListToModule' : 'getModuleList';

        this[method]().then(function(modules) {
            promise.fulfill(this.sortModules(modules));
        }.bind(this)).done();

        return promise;
    },

    /**
     * Получить содержимое всех файлов всех очищенных модулей
     * @private
     * @returns {Promise}
     */
    getCleanFiles: function() {

        var promises = [];

        this.getCleanModules().forEach(function(module) {
            var promise = this.openCleanFiles(module.name);
            promises.push(promise);
            promise.then(function(filesContent) {
                if(!filesContent) return;
                this.clean.push(filesContent);
            }.bind(this)).done();
        }, this);

        return vow.all(promises);
    },

    /**
     * Открыть все файлы указанного очищенного модуля
     * @private
     * @param {String} module Имя модуля
     * @returns {Promise}
     */
    openCleanFiles: function(module) {

        var promise = vow.promise();

        if(!this.options.clean.hasOwnProperty(module)) {
            promise.fulfill('');
            return promise;
        }

        var moduleFiles = this.options.clean[module],
            files = Array.isArray(moduleFiles) ? moduleFiles : [moduleFiles];

        this.openFilesByOrder(files).then(function(filesContent) {
            promise.fulfill(filesContent.join('\n'));
        });

        return promise;
    },

    /**
     * Сформировать строку замыкания из отсортированного списка модулей
     * @returns {String}
     */
    convertToClosure: function() {

        var length = this.modules.length,
            cleaned = [],
            closure = [
                this.convertClean(),
                this.convertJSDoc(),
                '(function(global, undefined) {\nvar '
            ];

        this.modules.forEach(function(module, index) {

            var method = this.isClean(module)
                ? (cleaned.push(module.name), 'convertCleanModule')
                : 'convertDefaultModule';

            closure = closure.concat(this[method](module));

            index + 1 < length
                ? closure.push(',')
                : closure.push(';');

            closure.push('\n');
        }, this);

        if(cleaned.length) {
            closure = closure.concat([
                JSON.stringify(cleaned),
                '.forEach(function(g) { delete global[g]; });\n'
            ]);
        }

        closure.push('})(this);');

        // Если был добавлен хотя бы один модуль
        return this.closure = closure.length > 2 ? closure.join('') : '';
    },

    /**
     * Сформировать строку содержимого файлов очищенных модулей
     * @private
     * @returns {String}
     */
    convertClean: function() {
        if(!this.clean.length) return '';
        return this.clean.join('\n') + '\n';
    },

    /**
     * Сформировать строку JSDoc
     * @private
     * @returns {String}
     */
    convertJSDoc: function() {
        if(_.isEmpty(this.options.jsdoc)) return [];

        var jsdoc = ['/*!'],
            option = this.options.jsdoc;

        Object.keys(option).forEach(function(tag) {
            jsdoc.push(this.getJSDocTag(tag, option[tag]));
        }, this);

        jsdoc.push(' */\n');

        return jsdoc.join('\n');
    },

    /**
     * Получить строку JSDoc тега
     * @private
     * @param {String} tag Имя тега
     * @param {*} value Значение тега
     * @returns {String}
     */
    getJSDocTag: function(tag, value) {

        var before = ' * @' + tag + ' ';

        if(tag === 'date' && value === true) {
            return before + moment().lang('en').format('D MMMM YYYY');
        }

        return before + value;
    },

    /**
     * Сформировать строку для обычного модуля
     * @private
     * @param {Object} module Информация о модуле
     * @returns {Array}
     */
    convertDefaultModule: function(module) {

        var closure = [
                module.name,
                ' = (',
                module.body,
                ').call(global'
            ];

        if(module.deps.length) {
            closure.push(', ', module.deps.join(', '));
        }

        closure.push(')');

        return closure;
    },

    /**
     * Сформировать строку для очищенного модуля
     * @private
     * @param {Object} module Информация о модуле
     * @returns {Array}
     */
    convertCleanModule: function(module) {
        return [
            module.name,
            ' = global.',
            module.name
        ];
    },

    /**
     * Является ли модуль очищенным
     * @private
     * @param {Object} module Информация о модуле
     * @returns {boolean}
     */
    isClean: function(module) {
        return !!module.clean;
    },

    /**
     * Получить список очищенных модулей
     * @private
     * @returns {Object[]}
     */
    getCleanModules: function() {
        return this.modules.filter(function(module) {
            return this.isClean(module);
        }, this);
    },

    /**
     * Отсортировать полученный список всех модулей для сборки
     * @private
     * @param {Object} modules Список всех модулей
     * @returns {Object[]}
     */
    sortModules: function(modules) {

        Object.keys(modules).forEach(function(name) {

            var info = modules[name],
                dependencies = info.dependencies;

            if(!this.isModuleExist(name)) {

                dependencies.forEach(function(dependency) {
                    this.addModule('push', dependency, modules[dependency]);
                }, this);

                this.addModule('push', name, info);

            } else {

                dependencies.forEach(function(dependency) {
                    this.moveBefore(name, dependency, modules[dependency]);
                }, this);

            }

        }, this);

        return this.modules;
    },

    /**
     * Добавить модуль в отсортированный массив
     * @private
     * @param {String} method Метод для работы с массивом
     * @param {String} name Имя модуля
     * @param {Object} info Информация о модуле
     * @param {String[]} info.dependencies Зависимости модуля
     * @param {Function} info.body Тело модуля
     */
    addModule: function(method, name, info) {
        if(this.isModuleExist(name)) return;

        if(!info) {
            return this.console.error('Undefined module', [name]);
        }

        this.modules[method]({
            name: name,
            deps: info.dependencies,
            body: info.body,
            clean: info.clean
        });

        this.sortedModuleNames.push(name);
    },

    /**
     * Добавлен ли уже модуль в отсортированный массив
     * @private
     * @param {String} name Имя модуля
     * @returns {boolean}
     */
    isModuleExist: function(name) {
        return !!~this.sortedModuleNames.indexOf(name);
    },

    /**
     * Расположить один модуль перед другим
     * @private
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
     * @private
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
     * @private
     * @param {number} moduleIndex Индекс основного модуля
     * @param {number} dependencyIndex Индекс модуля-зависимости
     */
    moveBeforeIndex: function(moduleIndex, dependencyIndex) {
        this.modules.splice(moduleIndex, 0, this.modules[dependencyIndex]); // Скопировать на новое место
        this.modules.splice(dependencyIndex + 1, 1); // Удалить с прошлого места
    }

};

module.exports = Maker;
