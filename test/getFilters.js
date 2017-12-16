'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const Z = require('../');
const mockHttpClient = require('./helpers').mockHttpClient;


describe('get() filters', () => {
    it('accepts null', () => {
        assert.doesNotThrow(() => {
            Z.resource('session')
                .get(null, null, null);
        });
    });

    it('accepts an array of triplets', () => {
        assert.doesNotThrow(() => {
            Z.resource('session')
                .get(null, null, [
                    ['param1', '==', 1],
                    ['param2', '==', 2],
                ])
        });
    });

    it('throws error for array of non-triplets', () => {
        assert.throws(() => {
            Z.resource('session')
                .get(null, null, [
                    ['param1', '=='],
                ]);
        }, /get\(\) filters should be array of triplets/);
    });

    it('throws error for non-array', () => {
        assert.throws(() => {
            Z.resource('session')
                .get(null, null, {});
        }, /get\(\) filters should be array of triplets/);
    });

    it('generates correct query string for single filter', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.path,
                        '/v1/session?filter=param1%3D%3D1');
                },
            }),
        });

        Z.resource('session')
            .get(null, null, [
                [ 'param1', '==', 1 ],
            ]);
    });

    it('generates correct query string for two filters', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.path,
                        '/v1/session?filter=param1%3D%3D1&filter=param2%3D%3D2');
                },
            }),
        });

        Z.resource('session')
            .get(null, null, [
                [ 'param1', '==', 1 ],
                [ 'param2', '==', 2 ],
            ]);
    });
});
