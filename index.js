var http = require('http');
var https = require('https');


/**
 * Zetkin API utility. Use the exported Z singleton, or create separate
 * instances using Z.construct().
*/
var Zetkin = function() {
    var _token = null;
    var _config = {
        base: '',
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
            path: _config.base + '/session',
            auth: username + ':' + password
        };

        return _request(opts, null).then(function(res) {
            _token = res.data.data.token;
        });
    }

    /**
     * Get the token used for authentication in this instance.
    */
    this.getToken = function() {
        return _token;
    };

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
        path = Array.prototype.join.call(arguments, '/');
        if (path.length == 0 || path[0] != '/') {
            path = '/' + path;
        }

        if (_config.base) {
            path = _config.base + path;
        }

        return new ZetkinResourceProxy(this, path, _request);
    };

    /**
     * Make request via HTTP or HTTPS depending on the configuration.
    */
    var _request = function(options, data, meta) {
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
                        resolve({
                            data: data,
                            meta: meta,
                            httpStatus: res.statusCode
                        });
                    }
                    else {
                        reject({
                            data: data,
                            meta: meta,
                            httpStatus: res.statusCode
                        });
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
    var _meta = {};

    this.getPath = function() {
        return path;
    };

    this.meta = function(keyOrObj, valueIfAny) {
        if (arguments.length == 2) {
            _meta[keyOrObj] = valueIfAny;
        }
        else {
            var key;
            for (key in keyOrObj) {
                _meta[key] = keyOrObj[key];
            }
        }

        return this;
    };

    this.get = function() {
        var opts = {
            method: 'GET',
            path: path
        };

        return _request(opts, null, _meta);
    };

    this.post = function(data) {
        var opts = {
            method: 'POST',
            path: path
        };

        return _request(opts, data, _meta);
    };

    this.patch = function(data) {
        var opts = {
            method: 'PATCH',
            path: path
        };

        return _request(opts, data, _meta);
    };

    this.del = function() {
        var opts = {
            method: 'DELETE',
            path: path
        };

        return _request(opts, null, _meta);
    };

    this.put = function(data) {
        var opts = {
            method: 'PUT',
            path: path
        };

        return _request(opts, data, _meta);
    };
};


var Z = new Zetkin()

Z.construct = function(instanceOptions) {
    zetkin = new Zetkin();
    zetkin.configure(instanceOptions);
    return zetkin;
}

module.exports = Z;
