const config = {
    release: {
        presets: [],
        plugins: [
            'lodash',
            '@babel/plugin-transform-flow-strip-types',
            'transform-inline-environment-variables',
        ]
    },
    development: {
        presets: [],
        plugins: [
            'lodash',
            '@babel/plugin-transform-flow-strip-types',
        ]
    },
    test: {
        presets: [
            '@babel/preset-env',
            '@babel/preset-react',
        ],
        plugins: [
            'lodash',
            '@babel/plugin-transform-flow-strip-types',
            '@babel/plugin-proposal-object-rest-spread',
            ['@babel/plugin-transform-runtime',
                {
                    regenerator: true
                }
            ]
        ]
    }
}

module.exports = function(api) {
    api && api.cache(true);
    const envConfig = config[process.env.NODE_ENV];

    if (!envConfig) {
        throw new Error('Error: Babel config not found.')
    } else {
        return envConfig;
    }
};
