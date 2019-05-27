const config = {
    release: {
        presets: [
            [
                '@babel/preset-env',
                {
                    modules: false,
                    loose: true,
                },
            ],
            '@babel/preset-react',
        ],
        plugins: [],
    },
    development: {
        presets: [
            [
                '@babel/preset-env',
                {
                    modules: false,
                    loose: true,
                },
            ],
            '@babel/preset-react',
        ],
        plugins: [],
    },
    test: {
        presets: [
            '@babel/preset-env',
            '@babel/preset-react',
        ],
        plugins: [
            [
                '@babel/plugin-transform-runtime',
                {
                    regenerator: true,
                },
            ],
        ],
    },
};

module.exports = function(api) {
    api && api.cache(true);
    const envConfig = config[process.env.NODE_ENV];

    if (!envConfig) {
        throw new Error('Error: Babel config not found.');
    } else {
        return {
            presets: [
                ...envConfig.presets
            ],
            plugins: [
                'lodash',
                '@babel/plugin-transform-flow-strip-types',
                ...envConfig.plugins
            ]
        };
    }
};
