'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const Z = require('../');
const mockHttpClient = require('./helpers').mockHttpClient;


describe('resource proxy meta()', () => {
    it('accepts key and value', () => {
        assert.doesNotThrow(() => {
            Z.resource('session')
                .meta('key', 'value');
        });
    });

    it('accepts object', () => {
        assert.doesNotThrow(() => {
            Z.resource('session')
                .meta({
                    first_name: 'Clara',
                    last_name: 'Zetkin',
                });
        });
    });

    it('throws error for non-object single argument', () => {
        assert.throws(() => {
            Z.resource('session')
                .meta(1);
        }, /Invalid meta\(\) signature.*/);

        assert.throws(() => {
            Z.resource('session')
                .meta('key');
        }, /Invalid meta\(\) signature.*/);

        assert.throws(() => {
            Z.resource('session')
                .meta(null);
        }, /Invalid meta\(\) signature.*/);
    });

    it('throws error for more than two arguments', () => {
        assert.throws(() => {
            Z.resource('session')
                .meta(1, 2, 3);
        }, /Invalid meta\(\) signature.*/);
    });

    it('throws error for zero arguments', () => {
        assert.throws(() => {
            Z.resource('session')
                .meta();
        }, /Invalid meta\(\) signature.*/);
    });

    it('passes metadata to response', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient(),
        });

        Z.resource('session')
            .meta('one', 1)
            .meta({
                two: 2,
                three: 3,
            })
            .get()
            .then(res => {
                assert.deepEqual(res.meta, {
                    one: 1,
                    two: 2,
                    three: 3,
                });

                done();
            })
            .catch(err => done(err));
    });

    it('passes metadata to error', done => {
        let Z = proxyquire('../', {
            https: mockHttpClient({
                mockResponseStatus: 404,
            }),
        });

        Z.resource('session')
            .meta('one', 1)
            .meta({
                two: 2,
                three: 3,
            })
            .get()
            .catch(err => {
                assert.deepEqual(err.meta, {
                    one: 1,
                    two: 2,
                    three: 3,
                });

                done();
            })
            .catch(err => done(err));
    });
});
