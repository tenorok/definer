const fs = require('fs'),
    vm = require('vm'),
    vow = require('vow');

function Maker() {}

Maker.prototype = {

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
