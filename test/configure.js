'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const mockHttpClient = require('./helpers').mockHttpClient;


describe('configure()', () => {
    it('accepts known properties', () => {
        let Z = require('../');

        assert.doesNotThrow(() => {
            Z.configure({
                host: 'api.dev.zetkin.org',
                version: 1,
                ssl: false,
            });
        });
    });

    it('throws error when invoked without properties', () => {
        let Z = require('../');

        assert.throws(() => {
            Z.configure();
        }, /Options may not be undefined/);
    });

    it('throws error for unknown property', () => {
        let Z = require('../');

        assert.throws(() => {
            Z.configure({
                foo: 'value',
            });
        }, /Unknown config option: foo/);
    });

    it('respects domain setting when making requests', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                validateRequestCount: 1,
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.hostname, 'api.dummy.zetkin.org');
                },
            }),
        });

        Z.configure({
            host: 'api.dummy.zetkin.org',
        });

        Z.resource('org', 1, 'campaigns')
            .get()
            .catch(err => done(err));
    });

    it('defaults to TLS=true when making requests', done => {
        let Z = proxyquire('../', {
            http: mockHttpClient({
                done: () => done('Expected HTTPS but used HTTP'),
            }),
            https: mockHttpClient({
                done: done,
            }),
        });

        Z.resource('org', 1, 'campaigns')
            .get()
            .catch(err => done(err));
    });

    it('respects TLS=false when making requests', done => {
        let Z = proxyquire('../', {
            http: mockHttpClient({
                done: done,
            }),
            https: mockHttpClient({
                done: () => done('Expected HTTP but used HTTPS'),
            }),
        });

        Z.configure({
            ssl: false,
        });

        Z.resource('org', 1, 'campaigns')
            .get()
            .catch(err => done(err));
    });
});
