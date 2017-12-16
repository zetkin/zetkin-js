'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const mockHttpClient = require('./helpers').mockHttpClient;


describe('resource proxy', () => {
    it('get() makes correct request', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.method, 'GET');
                    assert.equal(opts.path, '/v1/users/me');
                },
            }),
        });

        Z.resource('users', 'me')
            .get()
            .catch(err => done(err));
    });

    it('patch() makes correct request', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.method, 'PATCH');
                    assert.equal(opts.path, '/v1/users/me');
                },
                validateRequestData: data => {
                    assert.deepEqual(data, { first_name: 'Clara' });
                },
            }),
        });

        Z.resource('users', 'me')
            .patch({ first_name: 'Clara' })
            .catch(err => done(err));
    });

    it('post() makes correct request', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.method, 'POST');
                    assert.equal(opts.path, '/v1/users/me');
                },
                validateRequestData: data => {
                    assert.deepEqual(data, { first_name: 'Clara' });
                },
            }),
        });

        Z.resource('users', 'me')
            .post({ first_name: 'Clara' })
            .catch(err => done(err));
    });

    it('del() makes correct request', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.method, 'DELETE');
                    assert.equal(opts.path, '/v1/users/me');
                },
            }),
        });

        Z.resource('users', 'me')
            .del()
            .catch(err => done(err));
    });

    it('put() makes correct request', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                done: done,
                validateRequestOptions: opts => {
                    assert.equal(opts.method, 'PUT');
                    assert.equal(opts.path, '/v1/users/me');
                },
            }),
        });

        Z.resource('users', 'me')
            .put()
            .catch(err => done(err));
    });

    it('correctly throws error for non-2xx status-code', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                mockResponseStatus: 404,
                mockResponseData: {
                    title: 'error title',
                    description: 'error description',
                },
            }),
        });

        Z.resource('users', 'me')
            .get()
            .then(res => {
                assert.fail('Request succeeded unexpectedly');
            })
            .catch(err => {
                assert.deepEqual(err, {
                    meta: {},
                    httpStatus: 404,
                    data: {
                        title: 'error title',
                        description: 'error description',
                    },
                });
                done();
            })
            .catch(err => done(err));
    });

    it('correctly throws error for non-HTTP error', done=> {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                mockError: { isMockError: true },
            }),
        });

        Z.resource('users', 'me')
            .get()
            .then(res => {
                assert.fail('Request succeeded unexpectedly');
            })
            .catch(err => {
                assert.deepEqual(err, {
                    isMockError: true,
                });

                done();
            })
            .catch(err => done(err));
    });
});
