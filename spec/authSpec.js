describe('Authentication specs', function() {
    var Z = require('..');
    var mocks = require('./support/mocks');
    var https = require('https');

    it('makes a request to create a session', function() {
        var onAuthenticated = jasmine.createSpy('onAuthenticated');
        var session = { data: { token: 'abc123' }};

        mocks.spyOnRequest(https, 'POST', '/session', null,
            201, JSON.stringify(session), function(options) {
                expect(options.auth).toBe('testuser@example.com:password');
            });


        Z.authenticate('testuser@example.com', 'password', onAuthenticated);
        expect(https.request.calls.count()).toBe(1);
        expect(onAuthenticated.calls.count()).toBe(1);
        expect(onAuthenticated).toHaveBeenCalledWith(
            true, session, 201);
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
