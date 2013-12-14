var path = require('path'),
    assert = require('chai').assert,
    vow = require('vow'),
    helper = require('./helper.js'),
    Maker = require('../../maker.js');

var savePromise,
    saveFilePath = 'test/maker/modules/all.js';

function execCommand(options, standardResult, done) {

    savePromise = vow.promise();

    helper.exec('./bin/definer ' + options + ' ' + saveFilePath)
        .then(function() {
            return helper.readFile(saveFilePath);
        })
        .then(function(savedFileContent) {
            assert.equal(savedFileContent, standardResult);
            savePromise.fulfill();
            done();
        })
        .done();
}

describe('Тестирование CLI.', function() {

    it('Все модули', function(done) {
        execCommand('-d test/maker/modules/', helper.getClosureString(), done);
    });

    it('Только модуль c', function(done) {
        execCommand('-d test/maker/modules/ -m c', helper.getClosureStringModuleC(), done);
    });

    after(function(done) {
        vow.all([savePromise, helper.unlink(saveFilePath)]).then(function() {
            savePromise = undefined;
            done();
        });
    });

});
