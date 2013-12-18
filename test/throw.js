var assert = require('chai').assert,
    define = require('../definer.js').define;

describe('Тест на выброс исключения при отсутствии модуля.', function() {

    it('На примере модуля b3', function() {
        assert.throw(function() { define('b3', function(a3) {}) }, ReferenceError, 'module a3 is not defined');
        var a3 = define('a3', function() {});
    });

});
