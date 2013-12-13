var assert = require('chai').assert,
    Maker = require('../../maker.js');

describe('isValidFilePostfix', function() {

    it('File: filename.js; Postfix: js', function() {
        assert.isTrue(new Maker({ postfix: 'js' }).isValidFilePostfix('filename.js'));
    });

    it('File: filename.js; Postfix: css', function() {
        assert.isFalse(new Maker({ postfix: 'css' }).isValidFilePostfix('filename.js'));
    });

    it('File: filename.js; Postfix: module.js', function() {
        assert.isFalse(new Maker({ postfix: 'module.js' }).isValidFilePostfix('filename.js'));
    });

    it('File: name.my.module.js; Postfix: js', function() {
        assert.isTrue(new Maker({ postfix: 'js' }).isValidFilePostfix('name.my.module.js'));
    });

    it('File: name.my.module.js; Postfix: module.js', function() {
        assert.isTrue(new Maker({ postfix: 'module.js' }).isValidFilePostfix('name.my.module.js'));
    });

    it('File: name.my.module.js; Postfix: my.module.js', function() {
        assert.isTrue(new Maker({ postfix: 'my.module.js' }).isValidFilePostfix('name.my.module.js'));
    });

    it('File: name.my.module.js; Postfix: name.my.module.js', function() {
        assert.isFalse(new Maker({ postfix: 'name.my.module.js' }).isValidFilePostfix('name.my.module.js'));
    });

});
