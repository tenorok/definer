var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

describe('Конвертирование модулей в строку без define.', function() {

    it('Конвертирование модулей с файловой системы', function(done) {

        var maker = new Maker();

        maker.getModules(path.join(__dirname, 'modules')).then(function(modules) {

            var closure = '(function(global) {\n' +
                'var a = (function () { return \'a\'; }).call(global),\n' +
                'b = (function (a){return a + \'b\';}).call(global, a),\n' +
                'c = (function (a, b) {\n' +
                '    return a + b + \'c\';\n' +
                '}).call(global, a, b),\n' +
                'd = (function (\n' +
                '        a,\n' +
                '        b,\n' +
                '        c\n' +
                '    ){\n' +
                '        return a + b + \'c\';\n' +
                '    }).call(global, a, b, c),\n' +
                'e = (function (d) { return d + \'e\'; }).call(global, d),\n' +
                'f = (function () { return \'f\'; }).call(global);\n' +
            '})(this);';

            assert.deepEqual(
                maker.convertToClosure(),
                closure
            );

            done();
        }).done();
    });

});
