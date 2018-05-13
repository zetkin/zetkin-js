'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const mockHttpClient = require('./helpers').mockHttpClient;

const VALID_CODE_URL = 'http://www.dev.zetkin.org/oauth/?code=0aibpXfZQfGpW8gGjMvneg';
const VALID_TOKEN_URL = 'http://www.dev.zetkin.org/oauth/#access_token=00698eece7d9469975026c18969a3d8b&expires_in=3600&token_type=bearer';


describe('authenticate()', () => {
    it('throws error if not configured', () => {
        let z = require('../').construct();

        assert.throws(() => {
            z.authenticate(VALID_TOKEN_URL);
        }, /not configured/);
    });

    it('throws error for no argument', () => {
        let z = require('../').construct();

        z.configure({ clientId: 'abc123' });

        assert.throws(() => {
            z.authenticate();
        }, /URL/);
    });

    it('correctly invokes token.getToken() on the internal client', done => {
        let z = proxyquire('../', {
            'client-oauth2': function() {
                this.token = {
                    getToken: url => {
                        assert.equal(url, VALID_TOKEN_URL);
                        done();
                    },
                };
            },
        }).construct();

        z.configure({ clientId: 'abc123' });
        z.authenticate(VALID_TOKEN_URL);
    });

    it('correctly invokes code.getToken() on the internal client', done => {
        let z = proxyquire('../', {
            'client-oauth2': function() {
                this.code = {
                    getToken: url => {
                        assert.equal(url, VALID_CODE_URL);
                        done();
                    },
                };
            },
        }).construct();

        z.configure({ clientId: 'abc123', clientSecret: 'abc123' });
        z.authenticate(VALID_CODE_URL);
    });
});
