var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

function getAbsoluteFilePath(fileList) {
    return fileList.map(function(filePath) {
        return path.join(__dirname, filePath);
    });
}

describe('getFileList', function() {

    it('getFileList modules', function(done) {
        new Maker({
            directory: path.join(__dirname, 'modules')
        }).getFileList().then(function(filelist) {

            assert.deepEqual(filelist, getAbsoluteFilePath([
                'modules/b.js',
                'modules/d.js',
                'modules/sub/c.js',
                'modules/sub/sub/a.js',
                'modules/sub/sub/ef.js',
                'modules/sub/sub/fake.js'
            ]));

            done();
        }).done();
    });

});
