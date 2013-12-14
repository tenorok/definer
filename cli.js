const path = require('path'),
    commander = require('commander'),
    clicolor = require('cli-color'),
    Maker = require('./maker.js');

commander
    .version('0.0.1')
    .usage('[options] <file>')
    .option('-d, --directory [path]', 'start directory path', '.')
    .option('-m, --module [name]', 'target module name')
    .option('-p, --postfix [postfix]', 'postfix to find files')
    .parse(process.argv);

/**
 * Конструктор
 * @constructor
 */
function Cli(filePath, options) {
    this.saveFilePath = this.getAbsolutePath(filePath);
    this.options = {
        directory: this.getAbsolutePath(options.directory),
        module: options.module,
        postfix: options.postfix
    };
}

Cli.prototype = {

    /**
     * Current working directory
     */
    cwd: process.cwd(),

    /**
     * Получить абсолютный путь из отностильного
     * @param {String} relativePath Относительный путь
     * @returns {String}
     */
    getAbsolutePath: function(relativePath) {
        return path.join(this.cwd, relativePath);
    },

    /**
     * Запустить выполнение
     */
    run: function() {
        new Maker({
            directory: this.options.directory,
            module: this.options.module,
            postfix: this.options.postfix
        }).make(this.saveFilePath).then(function(saved) {
            saved
                ? console.log(clicolor.green('Saved:'), this.saveFilePath)
                : console.log(clicolor.redBright('Modules not found'));
        }.bind(this)).done();
    }
};

module.exports.run = function() {

    if(!commander.args.length) {
        return commander.outputHelp();
    }

    new Cli(commander.args[0], {
        directory: commander.directory,
        module: commander.module,
        postfix: commander.postfix
    }).run();
};
