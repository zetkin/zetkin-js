'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const mockHttpClient = require('./helpers').mockHttpClient;


describe('get() pagination', () => {
    it('handles page argument', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.path, '/session?p=2');
                },
            }),
        });

        Z.resource('session')
            .get(2);
    });

    it('handles page and perPage arguments', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.path, '/session?p=2&pp=100');
                },
            }),
        });

        Z.resource('session')
            .get(2, 100);
    });
});
