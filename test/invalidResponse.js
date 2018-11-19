'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const Z = require('../');
const mockHttpClient = require('./helpers').mockHttpClient;


describe('requests()', () => {
    it('rejects invalid JSON for 200', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                mockResponseStatus: 200,
                mockResponseData: 'This is not JSON',
            }),
        });

        Z.resource('session')
            .get()
            .then(res => {
                assert.fail('Request succeeded unexpectedly');
            })
            .catch(err => {
                assert.deepEqual(err, {
                    meta: {},
                    httpStatus: 200,
                    data: null,
                });
                done();
            })
            .catch(err => done(err));
    });

    it('rejects invalid JSON for 404', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                mockResponseStatus: 404,
                mockResponseData: 'This is not JSON',
            }),
        });

        Z.resource('session')
            .get()
            .then(res => {
                assert.fail('Request succeeded unexpectedly');
            })
            .catch(err => {
                assert.deepEqual(err, {
                    meta: {},
                    httpStatus: 404,
                    data: null,
                });
                done();
            })
            .catch(err => done(err));
    });
});
