var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

describe('getModules', function() {

    it('getModules modules', function(done) {
        new Maker().getModules(path.join(__dirname, 'modules')).then(function(modules) {

            assert.deepEqual(Object.keys(modules), ['a', 'b', 'c', 'd', 'e', 'f']);

            done();
        }).done();
    });

});
