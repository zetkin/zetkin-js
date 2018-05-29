var Hawk = require('hawk');
var Hoek = require('hoek');
var http = require('http');
var https = require('https');
var ClientOAuth2 = require('client-oauth2')


/**
 * Zetkin API utility. Use the exported Z singleton, or create separate
 * instances using Z.construct().
*/
var Zetkin = function() {
    var _token = null;
    var _offsetSec = 0;
    var _client = null;
    var _config = {
        clientId: null,
        clientSecret: null,
        redirectUri: null,
        accessTokenUri: 'http://api.zetk.in/oauth/token/',
        authorizationUri: 'http://api.zetk.in/oauth/authorize/',
        scopes: [],
        base: '',
        version: 1,
        ssl: true,
        host: 'api.zetk.in',
        port: undefined,
    }

    this.configure = function(options) {
        if (!options) {
            throw new Error('Options may not be undefined');
        }

        for (var key in options) {
            if (key in _config) {
                _config[key] = options[key];
            }
            else {
                throw new TypeError('Unknown config option: ' + key);
            }
        }

        if (_config.clientId) {
            _client = new ClientOAuth2({
                clientId: _config.clientId,
                clientSecret: _config.clientSecret,
                accessTokenUri: _config.accessTokenUri,
                authorizationUri: _config.authorizationUri,
                redirectUri: _config.redirectUri,
                scopes: [],
            });
        }
    }

    this.getConfig = function() {
        return _config;
    }

    function _validateClientConfiguration() {
        if (_client) {
            return true;
        }
        else {
            throw new Error('SDK client not configured');
        }
    }

    this.getLoginUrl = function() {
        _validateClientConfiguration();
        return _config.clientSecret?
            _client.code.getUri() : _client.token.getUri();
    }

    this.authenticate = function(url) {
        if (!url) {
            throw new Error('Missing authentication redirect URL');
        }

        _validateClientConfiguration();

        var promise = _config.clientSecret?
            _client.code.getToken(url) : _client.token.getToken(url);

        return promise
            .then(token => _token = token);
    }

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

        path = _config.base + path;

        return new ZetkinResourceProxy(this, path, _request);
    };

    /**
     * Make request via HTTP or HTTPS depending on the configuration.
    */
    var _request = function(options, data, meta, ticket) {
        options.withCredentials = false;
        options.hostname = _config.host;
        options.port = _config.port || (_config.ssl? 443 : 80);
        options.ssl = _config.ssl;
        options.headers = options.headers || {};

        if (data) {
            options.headers['content-type'] = 'application/json';
        }

        if (_token) {
            _token.sign(options);
        }

        return requestPromise(options, data, meta);
    };
}


var ZetkinResourceProxy = function(z, path, _request) {
    var _meta = {};

    this.getPath = function() {
        return path;
    };

    this.meta = function(keyOrObj, valueIfAny) {
        if (keyOrObj == null) {
            throw new Error(
                'Invalid meta() signature: Pass key and value or object');
        }
        else if (arguments.length == 1 && typeof keyOrObj == 'object') {
            var key;
            for (key in keyOrObj) {
                _meta[key] = keyOrObj[key];
            }
        }
        else if (arguments.length == 2) {
            _meta[keyOrObj] = valueIfAny;
        }
        else {
            throw new Error(
                'Invalid meta() signature: Pass key and value or object');
        }

        return this;
    };

    this.get = function(page, perPage, filters) {
        var opts = {
            method: 'GET',
            path: path,
        };

        var query = [];

        if (page !== undefined && page !== null) {
            query.push('p=' + page || 0);

            if (perPage) {
                query.push('pp=' + perPage);
            }
        }

        if (filters) {
            if (filters.length) {
                for (var i = 0; i < filters.length; i++) {
                    if (filters[i].length !== 3) {
                        throw new Error(
                            'get() filters should be array of triplets');
                    }

                    var filter = filters[i].join('');
                    query.push('filter=' + encodeURIComponent(filter));
                }
            }
            else {
                throw new Error('get() filters should be array of triplets');
            }
        }

        if (query.length) {
            opts.path += '?' + query.join('&');
        }

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

function requestPromise(options, data, meta) {
    var client = options.ssl? https : http;

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
}


var Z = new Zetkin()

Z.construct = function(instanceOptions) {
    zetkin = new Zetkin();
    zetkin.configure(Z.getConfig());
    zetkin.configure(instanceOptions || {});
    return zetkin;
}

module.exports = Z;
