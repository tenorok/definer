const path = require('path'),
    commander = require('commander'),

    Maker = require('./maker'),
    Logger = require('./logger');

commander
    .version('0.0.1')
    .usage('[options] <file>')
    .option('-d, --directory <path>', 'start directory path', '.')
    .option('-m, --module <name>', 'target module name')
    .option('-p, --postfix <postfix>', 'postfix to find files')
    .option('-v, --verbose <modes>', 'l - log, i - info, w - warn, e - error', function(modes) { return modes.split(''); })
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
        postfix: options.postfix,
        verbose: this.resolveVerboseTypes(options.verbose || [])
    };

    this.console = new Logger(this.options.verbose);
}

Cli.prototype = {

    /**
     * Current working directory
     * @type {String}
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
     * Соответствие сокращённых и полных имён типов сообщений
     * @type {Object}
     */
    verboseAliases: {
        l: 'log',
        i: 'info',
        w: 'warn',
        e: 'error'
    },

    /**
     * Развернуть сокращённые типы сообщений в полные
     * @param {String[]} verbose Сокращённые типы сообщений
     * @returns {String[]}
     */
    resolveVerboseTypes: function(verbose) {
        return verbose.map(function(type) {
            return this.verboseAliases[type];
        }.bind(this));
    },

    /**
     * Запустить выполнение
     */
    run: function() {
        new Maker({
            directory: this.options.directory,
            module: this.options.module,
            postfix: this.options.postfix,
            verbose: this.options.verbose
        }).make(this.saveFilePath).then(function(saved) {
            saved
                ? this.console.info('Saved', [this.saveFilePath])
                : this.console.error(['Modules not found']);
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
        postfix: commander.postfix,
        verbose: commander.verbose
    }).run();
};
