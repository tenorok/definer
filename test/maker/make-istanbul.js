var path = require('path'),
    fs = require('fs'),
    vow = require('vow'),
    assert = require('chai').assert,
    Maker = require('../../maker.js'),
    helper = require('./helper.js');

describe('Сборка модулей для тестирования покрытия тестами с помощью Istanbul.', function() {

    describe('API.', function() {

        var savePromise = vow.promise(),
            saveFilePath = path.join(__dirname, 'modules/all.js');

        it('Все обычные модули и несколько целевых модулей для istanbul', function(done) {

            new Maker({
                directory: path.join(__dirname, 'modules'),
                istanbul: ['d', 'f'],
                verbose: ['error']
            }).make(saveFilePath).then(function() {

                    fs.readFile(saveFilePath, { encoding: 'UTF-8' }, function(err, data) {
                        assert.equal(data, helper.getClosureStringIstanbul());
                        savePromise.fulfill();
                    });

                    done();
                }).done();
        });

        it('Заданный модуль для сборки с одним целевым модулем для istanbul', function(done) {

            new Maker({
                directory: path.join(__dirname, 'modules'),
                module: 'c',
                istanbul: 'b',
                verbose: ['error']
            }).make(saveFilePath).then(function() {

                    fs.readFile(saveFilePath, { encoding: 'UTF-8' }, function(err, data) {
                        assert.equal(data, helper.getClosureStringModuleCIstanbul());
                        savePromise.fulfill();
                    });

                    done();
                }).done();
        });

        it('Заданный модуль с присутствием экспортируемых модулей', function(done) {

            new Maker({
                directory: path.join(__dirname, 'modules2'),
                module: 'y',
                istanbul: 'y',
                verbose: ['error']
            }).make(saveFilePath).then(function() {

                    fs.readFile(saveFilePath, { encoding: 'UTF-8' }, function(err, data) {
                        assert.equal(data, helper.getClosureStringExportModuleYIstanbul());
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

    describe('CLI.', function() {

        var cli = new helper.testCLI('./bin/definer -v e').setTarget('test/maker/modules/all.js');

        it('Все обычные модули и несколько целевых модулей для istanbul', function(done) {
            cli.exec('-d test/maker/modules/ -i d,f', helper.getClosureStringIstanbul(), done);
        });

        it('Clean-скрипты так же должны предваряться istanbul-комментарием', function(done) {
            cli.exec('-d test/maker/clean/ -c test/maker/clean/clean.json -i c -m c',
                helper.getClosureStringMakeCleanFilesModuleCIstanbul(), done);
        });

        after(function(done) {
            cli.unlinkAfterExec(done);
        });

    });

});
