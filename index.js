var http = require('http')


/**
 * Zetkin API utility. Use the exported Z singleton, or create separate
 * instances using Z.construct().
*/
var Zetkin = function() {
    var session = null;
    var config = {
        ssl: true,
        host: 'api.zetk.in',
        port: 80
    }

    this.configure = function(options) {
        for (var key in options) {
            if (key in config) {
                config[key] = options[key];
            }
            else {
                throw new TypeError('Unknown config option: ' + key);
            }
        }
    }

    this.getConfig = function() {
        return config;
    }
}


var Z = new Zetkin()

Z.construct = function(instanceOptions) {
    zetkin = new Zetkin();
    zetkin.configure(instanceOptions);
    return zetkin;
}

module.exports = Z;
