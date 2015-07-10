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
     * Retrieve a resource proxy through which requests to that resource can be
     * made.
     *
     * Example: Z.resource('orgs', 1, 'people').get() will make a HTTP GET
     * request to the /orgs/1/people resource.
    */
    this.resource = function() {
        var path = '/' + Array.prototype.join.call(arguments, '/');
        return new ZetkinResourceProxy(this, path, _request);
    };

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


var ZetkinResourceProxy = function(z, path, _request) {
    this.getPath = function() {
        return path;
    };

    this.get = function(cb) {
        var opts = {
            method: 'GET',
            path: path
        };

        _request(opts, null, cb);
    };

    this.post = function(data, cb) {
        var opts = {
            method: 'POST',
            path: path
        };

        _request(opts, data, cb);
    };

    this.patch = function(data, cb) {
        var opts = {
            method: 'PATCH',
            path: path
        };

        _request(opts, data, cb);
    };

    this.del = function(cb) {
        var opts = {
            method: 'DELETE',
            path: path
        };

        _request(opts, null, cb);
    };

    this.put = function(data, cb) {
        var opts = {
            method: 'PUT',
            path: path
        };

        _request(opts, data, cb);
    };
};


var Z = new Zetkin()

Z.construct = function(instanceOptions) {
    zetkin = new Zetkin();
    zetkin.configure(instanceOptions);
    return zetkin;
}

module.exports = Z;
