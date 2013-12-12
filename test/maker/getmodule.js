var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

function getModuleNames(modules) {
    return modules.map(function(module) { return module.name });
}

describe('Сборка зависимостей для конкретного модуля.', function() {

    it('Сборка модуля d', function(done) {
        new Maker().getModule('d', path.join(__dirname, 'modules')).then(function(modules) {

            assert.deepEqual(
                getModuleNames(modules),
                ['a', 'b', 'c', 'd']
            );

            done();
        }).done();
    });

    it('Сборка модуля e', function(done) {
        new Maker().getModule('e', path.join(__dirname, 'modules')).then(function(modules) {

            assert.deepEqual(
                getModuleNames(modules),
                ['a', 'b', 'c', 'd', 'e']
            );

            done();
        }).done();
    });

    it('Сборка модуля a', function(done) {
        new Maker().getModule('a', path.join(__dirname, 'modules')).then(function(modules) {

            assert.deepEqual(
                getModuleNames(modules),
                ['a']
            );

            done();
        }).done();
    });

});
