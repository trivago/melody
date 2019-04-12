module.exports = {
    parser: 'babel-eslint',
    extends: ['eslint:recommended', 'prettier'],
    globals: {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: false,
    },
    env: {
        browser: true,
        node: true,
        commonjs: true,
        'shared-node-browser': true,
        es6: true,
        jest: true,
    },
    rules: {
        // variable handling
        'no-unused-vars': ['error', { args: 'none' }],
        'prefer-const': [1],
        // 'one-var': 'off',
        // 'vars-on-top': 'off',
        'one-var-declaration-per-line': [1],
        // 'no-inline-comments': 'off',

        'no-extra-bind': 'error',
        'no-extra-label': 'error',
        'no-param-reassign': 'error',
    },
};
