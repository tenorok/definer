var assert = require('chai').assert,
    helper = require('./helper.js'),
    Maker = require('../../maker.js');

describe('Тестирование CLI.', function() {

    var cli = new helper.testCLI('./bin/definer -v e ').setTarget('test/maker/modules/all.js');

    it('Все модули', function(done) {
        cli.exec('-d test/maker/modules/', helper.getClosureString(), done);
    });

    it('Только модуль c', function(done) {
        cli.exec('-d test/maker/modules/ -m c', helper.getClosureStringModuleC(), done);
    });

    after(function(done) {
        cli.unlinkAfterExec(done);
    });

});
