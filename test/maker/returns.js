var path = require('path'),
    fs = require('fs'),
    vow = require('vow'),
    assert = require('chai').assert,
    Maker = require('../../maker.js'),
    helper = require('./helper.js');

describe('Тестирование функции экспорта.', function() {

    var savePromise = vow.promise(),
        saveFilePath = path.join(__dirname, 'modules/all.js');

    it('Сборка одного модуля', function(done) {

        new Maker({
            directory: path.join(__dirname, 'modules2'),
            module: 'z',
            verbose: ['error']
        }).make(saveFilePath).then(function() {

                fs.readFile(saveFilePath, { encoding: 'UTF-8' }, function(err, data) {
                    assert.equal(data, helper.getClosureStringReturnsModuleZ());
                    savePromise.fulfill();
                });

                done();
            }).done();
    });

    it('Сборка модуля из зависимости', function(done) {

        new Maker({
            directory: path.join(__dirname, 'modules2'),
            module: 'y',
            verbose: ['error']
        }).make(saveFilePath).then(function() {

                fs.readFile(saveFilePath, { encoding: 'UTF-8' }, function(err, data) {
                    assert.equal(data, helper.getClosureStringReturnsModuleY());
                    savePromise.fulfill();
                });

                done();
            }).done();
    });

    after(function(done) {
        vow.all([savePromise, helper.unlink(saveFilePath)]).then(function() {
            done();
        });
    });

});
