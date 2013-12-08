(function(global) {

    function Definer(name, body) {

        this.name = name;
        this.body = body;

        this.pushToPull();
    }

    /**
     * Объект для хранения всех объявленных модулей
     * @type {Object}
     */
    Definer.pool = {};

    Definer.prototype = {

        /**
         * Добавление модуля в пул
         */
        pushToPull: function() {
            Definer.pool[this.name] = {
                body: this.body
            };
        },

        getArguments: function() {
            var fnStr = this.body.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
            var args = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
            return this.arguments = args || [];
        },

        getDependencies: function() {
            var dependencies = [];
            this.getArguments().forEach(function(argument) {
                dependencies.push(Definer.pool[argument].export);
            });
            return dependencies;
        },

        callBody: function() {
            return Definer.pool[this.name].export = this.body.apply(global, this.getDependencies());
        }

    };

    global.define = function(name, body) {
        return new Definer(name, body).callBody();
    };

})(this);