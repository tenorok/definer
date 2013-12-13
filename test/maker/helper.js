const exec = require('child_process').exec,
    fs = require('fs'),
    vow = require('vow');

module.exports = {

    exec: function(command) {

        var promise = vow.promise();

        exec(command, function(err, stdout) {
            if(err) return promise.reject(err);
            // Удаление последнего лишнего переноса строки
            promise.fulfill(stdout.slice(0, -1));
        });

        return promise;
    },

    readFile: function(file) {

        var promise = vow.promise();

        fs.readFile(file, { 'encoding': 'utf-8' }, function(err, data) {
            if(err) return promise.reject(err);
            promise.fulfill(data);
        });

        return promise;
    },

    exists: function(path) {

        var promise = vow.promise();

        fs.exists(path, function(exists) {
            promise.fulfill(exists);
        });

        return promise;
    },

    unlink: function(path) {

        return vow
            .when(this.exists(path), function(exists) {
                return exists;
            })
            .then(function(exists) {

                var promise = vow.promise();
                if(!exists) return promise.fulfill();

                fs.unlink(path, function(err) {
                    if(err) return promise.reject(err);
                    promise.fulfill();
                });

                return promise;
            });
    },

    getClosureString: function() {
        return '(function(global) {\n' +
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
    }

};
