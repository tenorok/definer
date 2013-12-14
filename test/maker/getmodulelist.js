var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

describe('getModuleList', function() {

    it('getModuleList modules', function(done) {
        new Maker({
            directory: path.join(__dirname, 'modules')
        }).getModuleList().then(function(modules) {

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
