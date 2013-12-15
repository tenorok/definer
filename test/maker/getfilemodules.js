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
    var maker = new Maker({
            verbose: ['error']
        }),
        fileModulePath = modulePath(fileName);
    maker.openFile(fileModulePath).then(function(fileContent) {

        var fileModules = maker.getFileModules(fileModulePath, fileContent),
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

    it('getFileModules b', function(done) {
        assertFileModules('b', 'deepEqual', {'b': ['a']}, done);
    });

    it('getFileModules d', function(done) {
        assertFileModules('d', 'deepEqual', {'d': ['a', 'b', 'c']}, done);
    });

    it('getFileModules c', function(done) {
        assertFileModules('sub/c', 'deepEqual', {'c': ['a', 'b']}, done);
    });

    it('getFileModules a', function(done) {
        assertFileModules('sub/sub/a', 'deepEqual', {'a': []}, done);
    });

    it('getFileModules ef', function(done) {
        assertFileModules('sub/sub/ef', 'deepEqual', {'e': ['d'], 'f': []}, done);
    });

    it('getFileModules fake', function(done) {
        assertFileModules('sub/sub/fake', 'isNull', {}, done);
    });

});
