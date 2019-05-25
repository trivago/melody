module.exports = function(api) {
    debugger;
    api && api.cache(true);

    const presets = [
        '@babel/preset-env',
        '@babel/preset-react',
    ];
    const plugins = [
        'lodash',
        'transform-inline-environment-variables',
        '@babel/plugin-transform-flow-strip-types',
        '@babel/plugin-proposal-object-rest-spread',
        ['@babel/plugin-transform-runtime',
            {
                regenerator: true
            }
        ]
    ];

    return {
        presets,
        plugins,
    };
};
