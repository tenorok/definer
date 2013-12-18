var assert = require('chai').assert,
    define = require('../definer.js').define;

describe('Простой тест работы модулей.', function() {

    it('Модуль a', function() {
        var a = define('a', function() { return 'a'; });
        assert.equal(a, 'a');
    });

    it('Модуль b', function() {
        var b = define('b', function(a) { return a + 'b'; });
        assert.equal(b, 'ab');
    });

    it('Модуль c', function() {
        var c = define('c', function(a, b) { return a + b + 'c'; });
        assert.equal(c, 'aabc');
    });

    it('Модуль d', function() {
        var d = define('d', function(c) { return c + '!'; });
        assert.equal(d, 'aabc!');
    });

});
