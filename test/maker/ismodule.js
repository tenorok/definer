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
    return path.join(__dirname, '/modules/' + fileName + '.js');
}

/**
 * Является ли файл модулем
 * @param {String} fileName Имя файла модуля
 * @param {String} method Имя метода для тестирования
 * @param {Function} done Функция Mocha
 */
function isModule(fileName, method, done) {
    var maker = new Maker();
    maker.openFile(modulePath(fileName)).then(function(file) {
        assert[method](maker.isModule(file));
        done();
    }).done();
}

describe('isModule', function() {

    it('isModule a', function(done) {
        isModule('a', 'isTrue', done);
    });

    it('isModule b', function(done) {
        isModule('b', 'isTrue', done);
    });

    it('isModule c', function(done) {
        isModule('c', 'isTrue', done);
    });

    it('isModule d', function(done) {
        isModule('d', 'isTrue', done);
    });

    it('isModule fake', function(done) {
        isModule('fake', 'isFalse', done);
    });

});
