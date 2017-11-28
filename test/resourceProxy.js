'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const Z = require('../');

const MOCK_CLIENT_DEFAULTS = {
    done: () => {},
    validateRequestOptions: opts => true,
    validateRequestData: data => true,
    mockResponseStatus: 200,
    mockResponseData: {},
};

const mockHttpClient = mockOpts => {
    mockOpts = Object.assign({}, MOCK_CLIENT_DEFAULTS, mockOpts);

    let failed = false;
    let reqOnError;
    let resOnData;
    let resOnEnd;

    return {
        request: (options, cb) => {
            try {
                mockOpts.validateRequestOptions(options);
            }
            catch (err) {
                failed = true;
                mockOpts.done(err);
            }

            return {
                on: (ev, handler) => {
                    if (ev == 'error') reqOnError = handler;
                },
                write: data => {
                    try {
                        !failed && mockOpts.validateRequestData(JSON.parse(data));
                    }
                    catch (err) {
                        failed = true;
                        mockOpts.done(err);
                    }
                },
                end: () => {
                    process.nextTick(() => {
                        let data = JSON.stringify(mockOpts.mockResponseData);

                        resOnData(data);
                        resOnEnd();

                        !failed && mockOpts.done();
                    });

                    cb({
                        statusCode: mockOpts.mockResponseStatus,
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
});
