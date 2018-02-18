'use strict';

const url = require('url');
const assert = require('assert');


describe('getLoginUrl()', () => {
    it('creates URI with code when configured with secret', () => {
        let z = require('../').construct({
            clientId: 'abc123',
            clientSecret: '123abc',
        });

        let urlData = url.parse(z.getLoginUrl(), true);
        assert.ok(urlData);
        assert.ok(urlData.query);
        assert.equal(urlData.query.client_id, 'abc123');
        assert.equal(urlData.query.response_type, 'code');
    });

    it('creates URI with token when configured without secret', () => {
        let z = require('../').construct({
            clientId: 'abc123',
        });

        let urlData = url.parse(z.getLoginUrl(), true);
        assert.ok(urlData);
        assert.ok(urlData.query);
        assert.equal(urlData.query.client_id, 'abc123');
        assert.equal(urlData.query.response_type, 'token');
    });

    it('throws error if not configured', () => {
        let z = require('../').construct();

        assert.throws(() => {
            z.getLoginUrl();
        }, /not configured/);
    });
});
