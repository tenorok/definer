const path = require('path'),
    fs = require('fs'),

    commander = require('commander'),
    _ = require('underscore'),

    Maker = require('./maker'),
    Logger = require('./logger'),

    defaultConfigFile = 'definer.json';

commander
    .version('0.0.2')
    .usage('[options] <file>')
    .option('-d, --directory <path>', 'start directory path', '.')
    .option('-m, --module <name>', 'target module name')
    .option('-p, --postfix <postfix>', 'postfix to find files')
    .option('-v, --verbose <modes>', 'l - log, i - info, w - warn, e - error', function(modes) { return modes.split(''); })
    .option('-c, --config <file>', 'json format config', defaultConfigFile)
    .parse(process.argv);

/**
 * Конструктор
 * @constructor
 */
function Cli(filePath, options) {

    var verbose = this.resolveVerboseTypes(options.verbose || []);
    this.console = new Logger(verbose);

    this.saveFilePath = this.getAbsolutePath(filePath);

    this.options = _.extend(this.getConfig(options.config), this.cleanObject({
        directory: this.getAbsolutePath(options.directory),
        module: options.module,
        postfix: options.postfix,
        verbose: verbose
    }));
}

Cli.prototype = {

    /**
     * Current working directory
     * @private
     * @type {String}
     */
    cwd: process.cwd(),

    /**
     * Получить абсолютный путь из отностильного
     * @private
     * @param {String} relativePath Относительный путь
     * @returns {String}
     */
    getAbsolutePath: function(relativePath) {
        return path.join(this.cwd, relativePath);
    },

    /**
     * Удалить из объекта все неопределённые поля
     * @private
     * @param {Object} object Объект
     * @returns {Object}
     */
    cleanObject: function(object) {
        Object.keys(object).forEach(function(key) {
            if(!_.isUndefined(object[key])) return;
            delete object[key];
        });
        return object;
    },

    /**
     * Получить конфигурационный объект из файла
     * @private
     * @param {String} file Относительный путь до файла
     * @returns {Object}
     */
    getConfig: function(file) {
        var fullPath = path.join(this.cwd, file),
            configExists = fs.existsSync(fullPath),
            config = configExists
                ? JSON.parse(fs.readFileSync(fullPath, { encoding: 'UTF-8' }))
                : {};

        if(!configExists && file !== defaultConfigFile) {
            this.console.error('Missed config', [fullPath]);
            return config;
        }

        if(!config.hasOwnProperty('clean')) return config;

        Object.keys(config.clean).forEach(function(module) {
            var moduleFiles = config.clean[module],
                files = Array.isArray(moduleFiles) ? moduleFiles : [moduleFiles],
                filesFullPath = [];

            files.forEach(function(file) {
                filesFullPath.push(path.join(path.dirname(fullPath), file));
            });

            config.clean[module] = filesFullPath;
        });

        return config;
    },

    /**
     * Соответствие сокращённых и полных имён типов сообщений
     * @private
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
     * @private
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
            verbose: this.options.verbose,
            clean: this.options.clean
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
        verbose: commander.verbose,
        config: commander.config
    }).run();
};
