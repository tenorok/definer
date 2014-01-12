const exec = require('child_process').exec,
    fs = require('fs'),

    assert = require('chai').assert,
    vow = require('vow'),
    _ = require('underscore');

var binding = {

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
    }

};

function testCLI(bin) {
    this.bin = bin;
}

testCLI.prototype = {

    setTarget: function(target) {
        this.target = target;
        return this;
    },

    exec: function(options, standard, done) {

        var promise = vow.promise();

        binding.exec([this.bin, options, this.target].join(' '))
            .then(function() {
                return binding.readFile(this.target);
            }.bind(this))
            .then(function(savedFileContent) {
                assert.equal(savedFileContent, standard);
                promise.fulfill();
                done();
            })
            .done();

        return this.execPromise = promise;
    },

    unlinkAfterExec: function(done) {
        vow.all([this.execPromise, binding.unlink(this.target)]).then(function() {
            this.execPromise = undefined;
            done();
        }.bind(this));
    }

};

var closure = {

    getClosureString: function() {
        return '(function(global, undefined) {\n' +
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
    },

    getClosureStringModuleC: function() {
        return '(function(global, undefined) {\n' +
            'var a = (function () { return \'a\'; }).call(global),\n' +
            'b = (function (a){return a + \'b\';}).call(global, a),\n' +
            'c = (function (a, b) {\n' +
            '    return a + b + \'c\';\n' +
            '}).call(global, a, b);\n' +
            '})(this);';
    },

    getClosureStringClean: function() {
        return '(function(global, undefined) {\n' +
            'var _ = global._,\n' +
            '$ = global.$,\n' +
            'b = (function ($, _) { return \'b\'; }).call(global, $, _),\n' +
            'c = (function ($) { return \'c\'; }).call(global, $),\n' +
            'a = (function (b, c) { return \'a\' + b + c; }).call(global, b, c);\n' +
            '["_","$"].forEach(function(g) { delete global[g]; });\n' +
            '})(this);';
    },

    getClosureStringCleanModuleC: function() {
        return '(function(global, undefined) {\n' +
            'var $ = global.$,\n' +
            'c = (function ($) { return \'c\'; }).call(global, $);\n' +
            '["$"].forEach(function(g) { delete global[g]; });\n' +
            '})(this);';
    }

};

module.exports = _.extend({ testCLI: testCLI }, binding, closure);
