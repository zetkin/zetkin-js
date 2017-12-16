'use strict';

const assert = require('assert');

describe('construct()', () => {
    it('creates a new Z instance', () => {
        let Z = require('../');
        let instance = Z.construct();

        assert.ok(instance.resource);
        assert.ok(instance.configure);
        assert.ok(instance.getConfig);
    });

    it('copies options from original', () => {
        let Z = require('../');
        let instance = Z.construct();

        assert.deepEqual(Z.getConfig(), instance.getConfig());
    });

    it('overwrites config with instance options', () => {
        let version = Math.random();
        let Z = require('../');
        let instance = Z.construct({ version });

        assert.equal(instance.getConfig().host, Z.getConfig().host);
        assert.equal(instance.getConfig().version, version);
        assert.notEqual(Z.getConfig().version, version);
    });
});
