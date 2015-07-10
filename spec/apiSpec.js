describe('API requests', function() {
    var Z = require('..');
    var mocks = require('./support/mocks');
    var https = require('https');

    it('creates a resource proxy', function() {
        var resource = Z.resource('orgs', 1, 'people', 1337);
        expect(resource).toBeDefined();
        expect(resource.getPath()).toBe('/orgs/1/people/1337');
    });

    it('makes a GET request', function() {
        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'GET', '/orgs/1/people/1337', null,
            200, JSON.stringify({ data: {} }));

        Z.resource('orgs', 1, 'people', 1337).get(onComplete)

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            true, jasmine.any(Object), 200);
    });

    it('makes a POST request', function() {
        var obj = {
            'first_name': 'Clara',
            'last_name': 'Zetkin',
        };

        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'POST', '/orgs/1/people',
            JSON.stringify(obj), 201, JSON.stringify(obj));

        Z.resource('orgs', 1, 'people').post(obj, onComplete)

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            true, jasmine.any(Object), 201);
    });

    it('makes a PATCH request', function() {
        var obj = {
            'first_name': 'Clara',
            'last_name': 'Zetkin',
        }

        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'PATCH', '/orgs/1/people/1337',
            JSON.stringify(obj), 200, JSON.stringify({ data: {} }));

        Z.resource('orgs', 1, 'people', 1337).patch(obj, onComplete)

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            true, jasmine.any(Object), 200);
    });

    it('makes a DELETE request', function() {
        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'DELETE', '/orgs/1/people/1337', null,
            204, null);

        Z.resource('orgs', 1, 'people', 1337).del(onComplete)

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(true, null, 204);
    });

    it('makes a PUT request', function() {
        var obj = {
            'first_name': 'Clara',
            'last_name': 'Zetkin',
        }

        var onComplete = jasmine.createSpy('onComplete');
        mocks.spyOnRequest(https, 'PUT', '/orgs/1/people/1337',
            JSON.stringify(obj), 200, JSON.stringify({ data: {} }));

        Z.resource('orgs', 1, 'people', 1337).put(obj, onComplete)

        expect(https.request.calls.count()).toBe(1);
        expect(onComplete.calls.count()).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(
            true, jasmine.any(Object), 200);
    });
});
