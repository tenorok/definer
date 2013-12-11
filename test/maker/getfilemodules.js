var path = require('path'),
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
 * @param {Object} modules Массив имён модулей
 * @param {Function} done Функция Mocha
 */
function assertFileModules(fileName, method, modules, done) {
    var maker = new Maker();
    maker.openFile(modulePath(fileName)).then(function(fileContent) {

        var fileModules = maker.getFileModules(fileContent),
            resultModuleNames = fileModules && Object.keys(fileModules);

        assert[method](resultModuleNames, Object.keys(modules));

        for(var moduleName in fileModules) {
            var resultDependencies = fileModules[moduleName].dependencies,
                standardDependencies = modules[moduleName];

            assert.deepEqual(resultDependencies, standardDependencies);
        }

        done();
    }).done();
}

describe('getFileModules', function() {

    it('getFileModules a', function(done) {
        assertFileModules('a', 'deepEqual', {'a': []}, done);
    });

    it('getFileModules b', function(done) {
        assertFileModules('b', 'deepEqual', {'b': ['a']}, done);
    });

    it('getFileModules c', function(done) {
        assertFileModules('sub/c', 'deepEqual', {'c': ['a', 'b']}, done);
    });

    it('getFileModules d', function(done) {
        assertFileModules('sub/d', 'deepEqual', {'d': ['a', 'b', 'c']}, done);
    });

    it('getFileModules ef', function(done) {
        assertFileModules('sub/sub/ef', 'deepEqual', {'e': ['d'], 'f': []}, done);
    });

    it('getFileModules fake', function(done) {
        assertFileModules('sub/sub/fake', 'isNull', {}, done);
    });

});
