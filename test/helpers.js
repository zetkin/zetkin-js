'use strict';


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
                        if (mockOpts.mockError) {
                            reqOnError(mockOpts.mockError);
                        }
                        else {
                            let data = JSON.stringify(mockOpts.mockResponseData);

                            resOnData(data);
                            resOnEnd();
                        }

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


module.exports = {
    mockHttpClient,
};
