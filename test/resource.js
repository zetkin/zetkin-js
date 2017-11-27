'use strict';

const assert = require('assert');

const Z = require('../');


describe('resource()', () => {
    it('creates a resource proxy with the right methods', () => {
        let r = Z.resource('/users/me');

        assert.equal(typeof(r.get), 'function');
        assert.equal(typeof(r.post), 'function');
        assert.equal(typeof(r.patch), 'function');
        assert.equal(typeof(r.del), 'function');
    });

    it('creates a resource proxy with the right path', () => {
        let r = Z.resource('/users/me');
        assert.equal(r.getPath(), '/v1/users/me');
    });

    it('generates the correct path from components', () => {
        let r = Z.resource('users', 'me');
        assert.equal(r.getPath(), '/v1/users/me');
    });
});
