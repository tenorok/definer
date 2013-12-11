var fs = require('fs'),
    path = require('path'),
    assert = require('chai').assert,

    Maker = require('../../maker.js');

/**
 * Получить путь до модуля
 * @param {String} fileName Имя файла модуля
 * @returns {String}
 */
function modulePath(fileName) {
    return path.join(__dirname, '/modules/', fileName + '.js');
}

/**
 * Проверить корректность получения модулей из файла
 * @param {String} fileName Имя файла модуля
 * @param {String} method Имя метода для тестирования
 * @param {Array} moduleNames Массив имён модулей
 * @param {Function} done Функция Mocha
 */
function assertFileModules(fileName, method, moduleNames, done) {
    var maker = new Maker();
    maker.openFile(modulePath(fileName)).then(function(fileContent) {

        var standard = getModulesObject(moduleNames).toString(),
            executed = maker.getFileModules(fileContent),
            result = executed ? executed.toString() : executed;

        assert[method](result, standard);

        done();
    }).done();
}

/**
 * Получить имитационный объект модулей по их именам
 * @param {Array} moduleNames Массив имён модулей
 * @returns {Object}
 */
function getModulesObject(moduleNames) {
    var modules = {};
    moduleNames.forEach(function(name) {
        modules[name] = function() {};
    });
    return modules;
}

describe('getFileModules', function() {

    it('getFileModules a', function(done) {
        assertFileModules('a', 'equal', ['a'], done);
    });

    it('getFileModules b', function(done) {
        assertFileModules('b', 'equal', ['b'], done);
    });

    it('getFileModules c', function(done) {
        assertFileModules('sub/c', 'equal', ['c'], done);
    });

    it('getFileModules d', function(done) {
        assertFileModules('sub/d', 'equal', ['d'], done);
    });

    it('getFileModules ef', function(done) {
        assertFileModules('sub/sub/ef', 'equal', ['e', 'f'], done);
    });

    it('getFileModules fake', function(done) {
        assertFileModules('sub/sub/fake', 'isNull', [], done);
    });

});
