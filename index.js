var Hawk = require('hawk');
var Hoek = require('hoek');
var http = require('http');
var https = require('https');


/**
 * Zetkin API utility. Use the exported Z singleton, or create separate
 * instances using Z.construct().
*/
var Zetkin = function() {
    var _ticket = null;
    var _config = {
        base: '',
        version: 1,
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
     * Initialize Z instance so that it's ready to make API calls. Requires
     * a set of application credentials consisting of an app ID and an app key
     * as well as an RSVP token as returned by the Zetkin Platform login page.
    */
    this.init = function(appId, appKey, rsvp, cb) {
        var app = {
            id: appId,
            key: appKey,
            algorithm: 'sha256',
        };

        var urlBase = (_config.ssl? 'https' : 'http')
            + '://' + _config.host + _config.base;

        var appHeader = hawkHeader(urlBase + '/oz/app', 'POST', app);
        var appOpts = {
            method: 'POST',
            path: _config.base + '/oz/app',
            json: true,
            headers: {
                authorization: appHeader.field,
                'content-type': 'application/json',
            }
        };

        return _request(appOpts, null)
            .then(function(res) {
                var appTicket = res.data;

                var rsvpHeader = hawkHeader(
                    urlBase + '/oz/rsvp', 'POST', appTicket);

                var rsvpOpts = {
                    method: 'POST',
                    path: _config.base + '/oz/rsvp',
                    json: true,
                    headers: {
                        authorization: rsvpHeader.field,
                        'content-type': 'application/json',
                    },
                };

                return _request(rsvpOpts, { rsvp: rsvp });
            })
            .then(function(res) {
                _ticket = res.data;

                cb(_ticket);
            });
    }

    /**
     * Get the ticket used for authentication in this instance.
    */
    this.getTicket = function() {
        return _ticket;
    };

    /**
     * Explicitly set a ticket without making an authentication request to the
     * API. Useful when ticket is retrieved through some other means.
    */
    this.setTicket = function(ticket) {
        _ticket = ticket;
    };

    /**
     * Retrieve a resource proxy through which requests to that resource can be
     * made.
     *
     * Example: Z.resource('orgs', 1, 'people').get() will make a HTTP GET
     * request to the /orgs/1/people resource.
    */
    this.resource = function() {
        var numRetries = 0;

        path = Array.prototype.join.call(arguments, '/');
        if (path.length == 0 || path[0] != '/') {
            path = '/' + path;
        }

        path = _config.base + '/v' + _config.version + path;

        var request = function(options, data, meta) {
            if (data) {
                options.headers = options.headers || {};
                options.headers['content-type'] = 'application/json';
            }

            return _request(options, data, meta)
                .catch(function(err) {
                    if (err.httpStatus === 401 && err.data.expired) {
                        var urlBase = (_config.ssl? 'https' : 'http')
                            + '://' + _config.host + _config.base;

                        var reissueHeader = hawkHeader(
                            urlBase + '/oz/reissue', 'POST', _ticket);

                        var reissueOpts = {
                            method: 'POST',
                            path: _config.base + '/oz/reissue',
                            json: true,
                            headers: {
                                authorization: reissueHeader.field,
                                'content-type': 'application/json',
                            },
                        };

                        return _request(reissueOpts)
                            .then(res => {
                                _ticket = res.data;

                                // Continue request
                                return _request(options, data, meta);
                            })
                    }
                    else if (err.httpStatus === 401
                        && err.data.message === 'Stale timestamp'
                        && numRetries < 3) {

                        // Reset internal clock and retry request
                        var msg = err.data.attributes;
                        if (Hawk.client.authenticateTimestamp(msg, _ticket)) {
                            numRetries++;
                            return _request(options, data, meta);
                        }
                        else {
                            throw err;
                        }
                    }
                    else {
                        throw err;
                    }
                });
        };

        return new ZetkinResourceProxy(this, path, request);
    };

    /**
     * Make request via HTTP or HTTPS depending on the configuration.
    */
    var _request = function(options, data, meta) {
        var client = _config.ssl? https : http;

        options.withCredentials = false;
        options.hostname = _config.host;
        options.port = _config.port;
        options.headers = options.headers || {};

        if (_ticket) {
            var urlBase = (_config.ssl? 'https' : 'http')
                + '://' + _config.host + _config.base;

            var uri = urlBase + options.path;

            options.headers.authorization =
                hawkHeader(uri, options.method, _ticket).field
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

function hawkHeader(uri, method, ticket, options) {
    var settings = Hoek.shallow(options || {});
    settings.credentials = ticket;
    settings.app = ticket.app;
    settings.dl = ticket.dlg;

    return Hawk.client.header(uri, method, settings);
}


var Z = new Zetkin()

Z.construct = function(instanceOptions) {
    zetkin = new Zetkin();
    zetkin.configure(Z.getConfig());
    zetkin.configure(instanceOptions);
    return zetkin;
}

module.exports = Z;
