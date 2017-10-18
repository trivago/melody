const { transformer } = require('../packages/melody-jest-transform');

// melody plugins
const { extension } = require('../packages/melody-extension-core');
const idom = require('../packages/melody-plugin-idom');

const customConfig = {
    plugins: [extension, idom],
};

// Don't change the name/signature of this function
exports.process = function(src, path) {
    return transformer(src, path, customConfig);
};
