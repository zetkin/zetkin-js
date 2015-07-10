var http = require('http');

var spyOnRequest = function(client, method, path, content,
                            responseCode, responseContent, extraExpects) {

    spyOn(client, 'request').and.callFake(function(options, cb) {
        expect(options.hostname).toBe('api.zetk.in');
        expect(options.port).toBe(80);
        expect(options.method).toBe(method);
        expect(options.path).toBe(path);

        if (extraExpects) {
            extraExpects(options);
        }

        var res = new http.IncomingMessage();
        res.statusCode = responseCode || 200;
        cb(res);

        // Mock request
        return {
            on: function(ev, func) {},
            write: function(chunk) {
                expect(chunk).toBe(content);
            },
            end: function() {
                if (responseContent) {
                    res.emit('data', responseContent);
                }

                res.emit('end');
            }
        };
    });
};


module.exports = {
    spyOnRequest: spyOnRequest
};
