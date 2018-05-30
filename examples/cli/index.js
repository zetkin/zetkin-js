'use strict';


const Z = require('../../');

Z.configure({
    clientId: 'efbc3f9d4ea444016391ccd7611ff871',
    clientSecret: 'MmYzM2I2OWMtYTI2Yy00YmQ1LTZhMzYtZDhiMmNhODBkNjZl',
    accessTokenUri: 'http://api.dev.zetkin.org/oauth/token/',
    authorizationUri: 'http://api.dev.zetkin.org/oauth/authorize/',
    redirectUri: 'http://www.dev.zetkin.org/oauth/',
    scopes: [],
    host: 'api.dev.zetkin.org',
    version: 1,
    ssl: false,
});

let _token = null;

const CMDS = {
    auth: {
        argCount: 1,
        func: args => {
            Z.authenticate(args[0])
                .then(token => _token = token);
        },
    },
    config: {
        argCount: 2,
        func: args => {
            switch (args[0].toString()) {
                case 'clientid':
                    Z.configure({ clientId: args[1] });
                    break;
                case 'clientsecret':
                    Z.configure({ clientSecret: args[1] });
                    break;
                default:
                    console.log('Unknown configure option, ' + args[0]);
                    return;
            }

            console.log('Configured ' + args[0]);
        },
    },
    get: {
        argCount: 1,
        func: args => {
            Z.resource(args[0])
                .get()
                .then(res => console.log(res));
        },
    },
    login: {
        func: () => {
            console.log('Login here, and authenticate with: auth <redir_url>');
            console.log(Z.getLoginUrl());
        },
    },
    token: {
        func: () => {
            if (_token) {
                console.log(_token);
            }
            else {
                console.log('No token! Login with the login command');
            }
        }
    },
};

process.stdin.on('data', buf => {
    let str = buf.toString();

    let [cmd, ...args] = str.replace(/\s*$/, '').split(/\s+/);

    if (cmd in CMDS) {
        const argCount = CMDS[cmd].argCount || 0;

        if (args.length == argCount) {
            CMDS[cmd].func(args);
        }
        else {
            console.log('Invalid argument count for ' + cmd + '. Should be ' + argCount);
        }
    }
    else {
        console.log('Unknown command, ' + cmd);
        console.log('Known commands: ' + Object.keys(CMDS));
    }
});
