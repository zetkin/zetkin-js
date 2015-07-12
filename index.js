var http = require('http');
var https = require('https');


/**
 * Zetkin API utility. Use the exported Z singleton, or create separate
 * instances using Z.construct().
*/
var Zetkin = function() {
    var _token = null;
    var _config = {
        ssl: true,
        host: 'api.zetk.in',
        port: 443
    }

    this.configure = function(options) {
        for (var key in options) {
            if (key in _config) {
                _config[key] = options[key];
            }
            else {
                throw new TypeError('Unknown config option: ' + key);
            }
        }
    }

    this.getConfig = function() {
        return _config;
    }


    /**
     * Authenticate as a Zetkin user to create a session. The token is stored
     * so that all subsequent API requests will be authenticated.
    */
    this.authenticate = function(username, password) {
        if (typeof username !== 'string')
            throw new TypeError('Username must be a string');

        if (typeof password !== 'string')
            throw new TypeError('Password must be a string');

        var opts = {
            method: 'POST',
            path: '/session',
            auth: username + ':' + password
        };

        return _request(opts, null).then(function(data, statusCode) {
            _token = data.data.token;
        });
    }

    /**
     * Explicitly set a token without making an authentication request to the
     * API. Useful when token is retrieved through some other means.
    */
    this.setToken = function(token) {
        _token = token;
    };

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
    var _request = function(options, data) {
        var client = _config.ssl? https : http;

        options.withCredentials = false;
        options.hostname = _config.host;
        options.port = _config.port;

        if (_token) {
            options.headers = {
                'Authorization': 'Zetkin-Token ' + _token
            };
        }

        return new Promise(function(resolve, reject) {
            req = client.request(options, function(res) {
                var json = '';

                if (res.setEncoding) {
                    // The setEncoding() method may not exist, e.g. if running in
                    // the browser using the Browserify abstraction layer.
                    res.setEncoding('utf-8');
                }

                res.on('data', function(chunk) {
                    json += chunk;
                });

                res.on('end', function() {
                    var data = json? JSON.parse(json) : null;

                    var success = (res.statusCode >= 200 && res.statusCode < 400);
                    if (success) {
                        resolve(data, res.statusCode);
                    }
                    else {
                        reject(data, res.statusCode);
                    }
                });
            });

            req.on('error', function(e) {
                reject(e);
            });

            if (data) {
                var json = JSON.stringify(data)
                req.write(json);
            }

            req.end();
        });
    };
}


var ZetkinResourceProxy = function(z, path, _request) {
    this.getPath = function() {
        return path;
    };

    this.get = function() {
        var opts = {
            method: 'GET',
            path: path
        };

        return _request(opts, null);
    };

    this.post = function(data, cb) {
        var opts = {
            method: 'POST',
            path: path
        };

        return _request(opts, data, cb);
    };

    this.patch = function(data) {
        var opts = {
            method: 'PATCH',
            path: path
        };

        return _request(opts, data);
    };

    this.del = function() {
        var opts = {
            method: 'DELETE',
            path: path
        };

        return _request(opts, null);
    };

    this.put = function(data) {
        var opts = {
            method: 'PUT',
            path: path
        };

        return _request(opts, data);
    };
};


var Z = new Zetkin()

Z.construct = function(instanceOptions) {
    zetkin = new Zetkin();
    zetkin.configure(instanceOptions);
    return zetkin;
}

module.exports = Z;
