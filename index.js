var http = require('http');
var https = require('https');


/**
 * Zetkin API utility. Use the exported Z singleton, or create separate
 * instances using Z.construct().
*/
var Zetkin = function() {
    var token = null;
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


    /**
     * Authenticate as a Zetkin user to create a session. The token is stored
     * so that all subsequent API requests will be authenticated.
    */
    this.authenticate = function(username, password, cb) {
        if (typeof username !== 'string')
            throw new TypeError('Username must be a string');

        if (typeof password !== 'string')
            throw new TypeError('Password must be a string');

        var opts = {
            method: 'POST',
            path: '/session',
            auth: username + ':' + password
        };

        _request(opts, null, function(success, data, statusCode) {
            if (success) {
                token = data.token;
            }

            if (cb !== undefined)
                cb(success, data, statusCode);
        });
    }

    /**
     * Make request via HTTP or HTTPS depending on the configuration.
    */
    var _request = function(options, data, cb) {
        var client = config.ssl? https : http;

        options.hostname = config.host;
        options.port = config.port;

        req = client.request(options, function(res) {
            var json = '';

            res.setEncoding('utf-8');
            res.on('data', function(chunk) {
                json += chunk;
            });

            res.on('end', function() {
                var data = json? JSON.parse(json) : null;

                cb(true, data, res.statusCode);
            });
        });

        req.on('error', function(e) {
            cb(false, e);
        });

        if (data) {
            var json = JSON.stringify(data)
            req.write(json);
        }

        req.end();

        return req;
    };
}


var Z = new Zetkin()

Z.construct = function(instanceOptions) {
    zetkin = new Zetkin();
    zetkin.configure(instanceOptions);
    return zetkin;
}

module.exports = Z;
