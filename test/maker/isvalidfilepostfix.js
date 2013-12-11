var assert = require('chai').assert,
    Maker = require('../../maker.js');

describe('isValidFilePostfix', function() {

    var maker = new Maker();

    it('File: filename.js; Postfix: js', function() {
        assert.isTrue(maker.isValidFilePostfix('filename.js', 'js'));
    });

    it('File: filename.js; Postfix: css', function() {
        assert.isFalse(maker.isValidFilePostfix('filename.js', 'css'));
    });

    it('File: filename.js; Postfix: module.js', function() {
        assert.isFalse(maker.isValidFilePostfix('filename.js', 'module.js'));
    });

    it('File: name.my.module.js; Postfix: js', function() {
        assert.isTrue(maker.isValidFilePostfix('name.my.module.js', 'js'));
    });

    it('File: name.my.module.js; Postfix: module.js', function() {
        assert.isTrue(maker.isValidFilePostfix('name.my.module.js', 'module.js'));
    });

    it('File: name.my.module.js; Postfix: my.module.js', function() {
        assert.isTrue(maker.isValidFilePostfix('name.my.module.js', 'my.module.js'));
    });

    it('File: name.my.module.js; Postfix: name.my.module.js', function() {
        assert.isFalse(maker.isValidFilePostfix('name.my.module.js', 'name.my.module.js'));
    });

});
