'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const Z = require('../');

const mockHttpClient = mockOpts => {
    mockOpts = mockOpts || {};

    let failed = false;
    let reqOnError;
    let resOnData;
    let resOnEnd;

    return {
        request: (options, cb) => {
            if (mockOpts.validateRequestOptions) {
                try {
                    mockOpts.validateRequestOptions(options);
                }
                catch (err) {
                    failed = true;
                    mockOpts.done(err);
                }
            }

            return {
                on: (ev, handler) => {
                    if (ev == 'error') reqOnError = handler;
                },
                write: data => {
                    if (!failed && mockOpts.validateRequestData) {
                        try {
                            mockOpts.validateRequestData(JSON.parse(data));
                        }
                        catch (err) {
                            failed = true;
                            mockOpts.done(err);
                        }
                    }
                },
                end: () => {
                    process.nextTick(() => {
                        let data = mockOpts.mockResponseData?
                            JSON.stringify(mockOpts.mockResponseData) : '';

                        resOnData(data);
                        resOnEnd();

                        if (!failed) {
                            mockOpts.done();
                        }
                    });

                    cb({
                        statusCode: mockOpts.mockResponseStatus || 200,
                        on: (ev, handler) => {
                            if (ev == 'data') resOnData = handler;
                            else if (ev == 'end') resOnEnd = handler;
                        },
                    })
                },
            }
        },
    };
};


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
            .catch(err => console.log(err))
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

});
