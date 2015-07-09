describe('Authentication specs', function() {
    it('makes a request to create a session', function() {
        var Z = require('..');
        var https = require('https');

        spyOn(https, 'request').and.callFake(function(options, cb) {
            expect(options.hostname).toBe('api.zetk.in');
            expect(options.port).toBe(80);
            expect(options.auth).toBe('testuser@example.com:password');
            expect(options.path).toBe('/session');

            cb(new https.IncomingMessage());
        }).and.callThrough();

        var onAuthenticated = jasmine.createSpy('onAuthenticated');

        Z.authenticate('testuser@example.com', 'password');
        expect(https.request.calls.count()).toBe(1);
    });

    it('rejects non-string username', function() {
        var Z = require('..');

        var authenticateWithNullUsername = function() {
            Z.authenticate(null, 'password');
        };

        expect(authenticateWithNullUsername)
            .toThrowError(TypeError, 'Username must be a string');
    });

    it('rejects non-string password', function() {
        var Z = require('..');

        var authenticateWithNullPassword = function() {
            Z.authenticate('testuser@example.com', null);
        };

        expect(authenticateWithNullPassword)
            .toThrowError(TypeError, 'Password must be a string');
    });
});
