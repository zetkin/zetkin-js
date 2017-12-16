'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const mockHttpClient = require('./helpers').mockHttpClient;


describe('configure()', () => {
    it('accepts known properties', () => {
        let z = require('../').construct();

        assert.doesNotThrow(() => {
            z.configure({
                host: 'api.dev.zetkin.org',
                version: 1,
                ssl: false,
            });
        });
    });

    it('stores and returns config through getConfig()', () => {
        let z = require('../').construct();

        z.configure({
            host: 'api.dev.zetkin.org',
            version: 1857,
            ssl: false,
        });

        let config = z.getConfig();

        assert.equal(config.host, 'api.dev.zetkin.org');
        assert.equal(config.version, 1857);
        assert.equal(config.ssl, false);
    });

    it('throws error when invoked without properties', () => {
        let z = require('../').construct();

        assert.throws(() => {
            z.configure();
        }, /Options may not be undefined/);
    });

    it('throws error for unknown property', () => {
        let z = require('../');

        assert.throws(() => {
            z.configure({
                foo: 'value',
            });
        }, /Unknown config option: foo/);
    });

    it('respects domain setting when making requests', done => {
        let z = proxyquire('../', {
            https: mockHttpClient({
                validateRequestCount: 1,
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.hostname, 'api.dummy.zetkin.org');
                },
            }),
        }).construct();

        z.configure({
            host: 'api.dummy.zetkin.org',
        });

        z.resource('org', 1, 'campaigns')
            .get()
            .catch(err => done(err));
    });

    it('defaults to TLS=true when making requests', done => {
        let z = proxyquire('../', {
            http: mockHttpClient({
                done: () => done('Expected HTTPS but used HTTP'),
            }),
            https: mockHttpClient({
                done: done,
            }),
        }).construct();

        z.resource('org', 1, 'campaigns')
            .get()
            .catch(err => done(err));
    });

    it('respects TLS=false when making requests', done => {
        let z = proxyquire('../', {
            http: mockHttpClient({
                done: done,
            }),
            https: mockHttpClient({
                done: () => done('Expected HTTP but used HTTPS'),
            }),
        }).construct();

        z.configure({
            ssl: false,
        });

        z.resource('org', 1, 'campaigns')
            .get()
            .catch(err => done(err));
    });
});
