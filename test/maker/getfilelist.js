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
        new Maker().getFileList(path.join(__dirname, 'modules'), 'js').then(function(filelist) {

            assert.deepEqual(filelist, getAbsoluteFilePath([
                'modules/a.js',
                'modules/b.js',
                'modules/sub/c.js',
                'modules/sub/d.js',
                'modules/sub/sub/ef.js',
                'modules/sub/sub/fake.js'
            ]));

            done();
        }).done();
    });

});
