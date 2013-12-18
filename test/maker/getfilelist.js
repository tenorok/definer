var path = require('path'),
    assert = require('chai').assert,
    Maker = require('../../maker.js');

function getAbsoluteFilePath(fileList) {
    return fileList.map(function(filePath) {
        return path.join(__dirname, filePath);
    });
}

describe('Тестирование метода getFileList.', function() {

    it('Получение всех файлов в директории', function(done) {
        new Maker({
            directory: path.join(__dirname, 'modules'),
            verbose: ['error']
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
