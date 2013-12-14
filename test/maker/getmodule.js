var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

function getModuleNames(modules) {
    return modules.map(function(module) { return module.name });
}

var modulesPath = path.join(__dirname, 'modules');

describe('Сборка зависимостей для конкретного модуля.', function() {

    it('Сборка модуля d', function(done) {
        new Maker({
            directory: modulesPath,
            module: 'd'
        }).getModule().then(function(modules) {

            assert.deepEqual(
                getModuleNames(modules),
                ['a', 'b', 'c', 'd']
            );

            done();
        }).done();
    });

    it('Сборка модуля e', function(done) {
        new Maker({
            directory: modulesPath,
            module: 'e'
        }).getModule().then(function(modules) {

            assert.deepEqual(
                getModuleNames(modules),
                ['a', 'b', 'c', 'd', 'e']
            );

            done();
        }).done();
    });

    it('Сборка модуля a', function(done) {
        new Maker({
            directory: modulesPath,
            module: 'a'
        }).getModule().then(function(modules) {

            assert.deepEqual(
                getModuleNames(modules),
                ['a']
            );

            done();
        }).done();
    });

});
