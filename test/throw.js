var assert = require('chai').assert,
    define = require('../definer.js').define;

describe('Definer', function() {

    it('Module b3', function() {
        assert.throw(function() { define('b3', function(a3) {}) }, ReferenceError, 'module a3 is not defined');
        var a3 = define('a3', function() {});
    });

});
