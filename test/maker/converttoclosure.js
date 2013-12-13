var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js'),
    helper = require('./helper.js');

describe('Конвертирование модулей в строку без define.', function() {

    it('Конвертирование модулей с файловой системы', function(done) {

        var maker = new Maker();

        maker.getModules(path.join(__dirname, 'modules')).then(function(modules) {;

            assert.deepEqual(
                maker.convertToClosure(),
                helper.getClosureString()
            );

            done();
        }).done();
    });

});
