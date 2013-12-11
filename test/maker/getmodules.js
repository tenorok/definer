var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

describe('getModules', function() {

    it('getModules modules', function(done) {
        new Maker().getModules(path.join(__dirname, 'modules')).then(function(modules) {

            var standardModules = {
                    'a': [],
                    'b': ['a'],
                    'c': ['a', 'b'],
                    'd': ['a', 'b', 'c'],
                    'e': ['d'],
                    'f': []
                },
                resultModules = Object.keys(modules);

            // Проверка наличия модуля в результирующем объекте
            // Из-за асинхронности порядок полученных модулей не гарантируется
            Object.keys(standardModules).forEach(function(module) {
                assert.isTrue(!!~resultModules.indexOf(module));
            });

            // Проверка правильного получения зависимостей каждого модуля
            for(var module in modules) {
                assert.deepEqual(modules[module].dependencies, standardModules[module]);
            }

            done();
        }).done();
    });

});
