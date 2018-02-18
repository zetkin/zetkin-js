var Hawk = require('hawk');
var Hoek = require('hoek');
var http = require('http');
var https = require('https');


/**
 * Zetkin API utility. Use the exported Z singleton, or create separate
 * instances using Z.construct().
*/
var Zetkin = function() {
    var _userTicket = null;
    var _appTicket = null;
    var _offsetSec = 0;
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
        port: 443
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

        var appOpts = {
            method: 'POST',
            path: _config.base + '/oz/app',
            json: true,
        };

        return _request(appOpts, null, null, app)
            .then(function(res) {
                _appTicket = res.data;

                if (!_appTicket) {
                    // TODO: Add error to callback
                    return cb(null);
                }

                if (rsvp) {
                    var rsvpOpts = {
                        method: 'POST',
                        path: _config.base + '/oz/rsvp',
                        json: true,
                    };

                    return _request(rsvpOpts, { rsvp: rsvp }, null, _appTicket);
                }
                else {
                    cb(_appTicket);
                }
            })
            .then(function(res) {
                _userTicket = res.data;
                _numInitRetries = 0;

                cb(_userTicket);
            })
    }

    /**
     * Get the ticket used for authentication in this instance.
    */
    this.getTicket = function() {
        return _userTicket;
    };

    /**
     * Explicitly set a ticket without making an authentication request to the
     * API. Useful when ticket is retrieved through some other means.
    */
    this.setTicket = function(ticket) {
        _userTicket = ticket;
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

        path = _config.base + '/v' + _config.version + path;

        return new ZetkinResourceProxy(this, path, _request);
    };

    /**
     * Make request via HTTP or HTTPS depending on the configuration.
    */
    var _request = function(options, data, meta, ticket) {
        options.withCredentials = false;
        options.hostname = _config.host;
        options.port = _config.port;
        options.ssl = _config.ssl;
        options.headers = options.headers || {};

        if (data) {
            options.headers['content-type'] = 'application/json';
        }

        // TODO: Is there ever a case for unauthenticated requests?
        if (ticket || _userTicket || _appTicket) {
            var urlBase = (_config.ssl? 'https' : 'http')
                + '://' + _config.host + _config.base;

            var ticket = ticket || _userTicket || _appTicket;
            var uri = urlBase + options.path;
            var header = hawkHeader(uri, options.method, ticket,
                { localtimeOffsetMsec: _offsetSec * 1000 });

            options.headers.authorization = header.field;
        }

        return requestPromise(options, data, meta)
            .catch(function(err) {
                // On first error, start counting retries
                if (options.numRetries === undefined) {
                    options.numRetries = 0;
                }

                if (err.httpStatus === 401 && err.data.expired) {
                    var urlBase = (_config.ssl? 'https' : 'http')
                        + '://' + _config.host + _config.base;

                    var reissueHeader = hawkHeader(
                        urlBase + '/oz/reissue', 'POST', _userTicket,
                        { localtimeOffsetMsec: _offsetSec * 1000 } );

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
                        .then(function(res) {
                            _userTicket = res.data;

                            // Continue request
                            return _request(options, data, meta);
                        })
                }
                else if (err.httpStatus === 401
                    && err.data.message === 'Stale timestamp'
                    && options.numRetries < 3) {

                    // Reset internal clock and retry request
                    var nowSec = Hawk.utils.nowSecs || Hawk.utils.nowSec;
                    _offsetSec = err.data.attributes.ts - nowSec();
                    options.numRetries++;
                    return _request(options, data, meta);
                }
                else {
                    throw err;
                }
            })
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

function hawkHeader(uri, method, ticket, options) {
    var settings = Hoek.shallow(options || {});
    settings.credentials = ticket;
    settings.app = ticket.app;
    settings.dl = ticket.dlg;

    return Hawk.client.header(uri, method, settings);
}

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
