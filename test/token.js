'use strict';

const assert = require('assert');
const btoa = require('btoa');


describe('Token management', () => {
    describe('setToken()', () => {
        it('accepts base64 encoded JSON data', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            z.setToken(btoa(JSON.stringify({
                access: 'abc123',
                refresh: '123abc',
                type: 'bearer',
            })));
        });

        it('throws error if unconfigured', () => {
            let z = require('../').construct();

            assert.throws(() => {
                z.setToken(btoa(JSON.stringify({
                    access: 'abc123',
                    refresh: '123abc',
                    type: 'bearer',
                })));
            });
        });

        it('throws error for invalid string', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            assert.throws(() => {
                z.setToken('this-is-not-base64');
            });

            assert.throws(() => {
                z.setToken(btoa('this-is-not-json'));
            });
        });

        it('throws error for invalid object', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            z.setToken(btoa(JSON.stringify({
                unknown: 'property',
            })));
        });
    });

    describe('getToken()', () => {
        it('returns same token', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            const TOKEN = btoa(JSON.stringify({
                access: 'abc123',
                refresh: '123abc',
                type: 'bearer',
            }));

            z.setToken(TOKEN);
            assert.equal(TOKEN, z.getToken());
        });

        it('throws error if not configured', () => {
            let z = require('../').construct();

            const TOKEN = btoa(JSON.stringify({
                access: 'abc123',
                refresh: '123abc',
                type: 'bearer',
            }));

            assert.throws(() => {
                z.setToken(TOKEN);
                assert.equal(TOKEN, z.getToken());
            });
        });

        it('returns null when not set', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            assert.equal(null, z.getToken());
        });
    });

    describe('getTokenData()', () => {
        it('returns token data', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            const TOKEN = btoa(JSON.stringify({
                access: 'abc123',
                refresh: '123abc',
                type: 'bearer',
            }));

            z.setToken(TOKEN);
            assert.deepEqual(z.getTokenData(), {
                access: 'abc123',
                refresh: '123abc',
                type: 'bearer',
            });
        });

        it('returns null if no token is set', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            assert.strictEqual(z.getTokenData(), null);
        });
    });

    describe('setTokenData()', () => {
        it('sets token data as expected', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            z.setTokenData({
                access: 'abc123',
                refresh: '123abc',
                type: 'bearer',
            });

            assert.deepEqual(z.getTokenData(), {
                access: 'abc123',
                refresh: '123abc',
                type: 'bearer',
            });
        });
    });

    describe('setAccessToken()', () => {
        it('sets just the access token and type', () => {
            let z = require('../').construct({
                clientId: 'abc123',
            });

            z.setAccessToken('abc123');
            assert.equal(z.getTokenData().access_token, 'abc123');
            assert.equal(z.getTokenData().token_type, 'bearer');
        });
    });
});
