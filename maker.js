const fs = require('fs'),
    path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    walk = require('walk');

function Maker() {}

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
                modules[name] = body;
            }
        });
        return Object.keys(modules).length ? modules : null;
    }

};

module.exports = Maker;
