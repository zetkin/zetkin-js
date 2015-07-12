describe('API requests', function() {
    var Z = require('..');
    var mocks = require('./support/mocks');
    var https = require('https');

    it('creates a resource proxy', function() {
        var resource = Z.resource('orgs', 1, 'people', 1337);
        expect(resource).toBeDefined();
        expect(resource.getPath()).toBe('/orgs/1/people/1337');
    });

    it('creates a resource proxy with base path', function() {
        Z.configure({ base: '/base' });
        var resource = Z.resource('orgs', 1, 'people', 1337);
        expect(resource).toBeDefined();
        expect(resource.getPath()).toBe('/base/orgs/1/people/1337');
    });

    xit('makes a request with a error response code', function() {
        var onComplete = jasmine.createSpy('onComplete');
        var onError = jasmine.createSpy('onError');
        mocks.spyOnRequest(https, 'GET', '/', null, 400);

        Z.resource().get().then(onComplete).catch(onError);

        expect(onComplete.calls.count()).toBe(0);
        expect(onError).toHaveBeenCalledWith(null, 400);
    });

    xit('makes a GET request', function(done) {
        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'GET', '/orgs/1/people/1337', null,
            200, JSON.stringify({ data: {} }));

        Z.resource('orgs', 1, 'people', 1337).get().then(onComplete);

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            jasmine.any(Object), 200);
    });

    xit('makes a POST request', function() {
        var obj = {
            'first_name': 'Clara',
            'last_name': 'Zetkin',
        };

        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'POST', '/orgs/1/people',
            JSON.stringify(obj), 201, JSON.stringify(obj));

        Z.resource('orgs', 1, 'people').post(obj).then(onComplete);

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            jasmine.any(Object), 201);
    });

    xit('makes a PATCH request', function() {
        var obj = {
            'first_name': 'Clara',
            'last_name': 'Zetkin',
        }

        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'PATCH', '/orgs/1/people/1337',
            JSON.stringify(obj), 200, JSON.stringify({ data: {} }));

        Z.resource('orgs', 1, 'people', 1337).patch(obj).then(onComplete);

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            jasmine.any(Object), 200);
    });

    xit('makes a DELETE request', function() {
        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'DELETE', '/orgs/1/people/1337', null,
            204, null);

        Z.resource('orgs', 1, 'people', 1337).del().then(onComplete);

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(null, 204);
    });

    xit('makes a PUT request', function() {
        var obj = {
            'first_name': 'Clara',
            'last_name': 'Zetkin',
        }

        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'PUT', '/orgs/1/people/1337',
            JSON.stringify(obj), 200, JSON.stringify({ data: {} }));

        Z.resource('orgs', 1, 'people', 1337).put(obj).then(onComplete);

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            true, jasmine.any(Object), 200);
    });
});
