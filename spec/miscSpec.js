describe('Misc specs', function() {
    it('can be configured', function() {
        var Z = require('..');

        Z.configure({ host: 'foobar' });
        var config = Z.getConfig();

        expect(config.host).toBe('foobar');
    });

    it('rejects unknown config option', function() {
        var Z = require('..');

        var configureWithBadParam = function() {
            Z.configure({ unknownParam: 'foobar' });
        };

        expect(configureWithBadParam)
            .toThrowError(TypeError, 'Unknown config option: unknownParam');
    });

    it('can be instantiated separately', function() {
        var Z = require('..');

        var zetkin = Z.construct();

        expect(zetkin).not.toBeNull();
        expect(zetkin.configure).toBeDefined();
    });

    it('can be configured when instantiated separately', function() {
        var Z = require('..');

        var zetkin = Z.construct({ host: 'foobar' });
        expect(zetkin).not.toBeNull();

        var config = zetkin.getConfig();
        expect(config.host).toBe('foobar');
    });

    it('rejects unknown config when instantiating', function() {
        var Z = require('..');

        var constructWithBadParam = function() {
            Z.construct({ unknownParam: 'foobar' });
        };

        expect(constructWithBadParam)
            .toThrowError(TypeError, 'Unknown config option: unknownParam');
    });
});
