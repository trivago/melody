import fs from 'fs';
import path from 'path';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';

const babelConfig = require('./babel.config');

// reads package.json of packages (melody-*) in packages directory
const pkg = fs.readFileSync(path.join(process.cwd(), './package.json'));
const pkgJSON = JSON.parse(pkg);

/**
 *  Default rollup config
 */
const config = {
    output: [
        {
            file: path.resolve(process.cwd(), pkgJSON.main),
            format: 'cjs',
        },
    ],
    plugins: [
        json(),
        babel({
            runtimeHelpers: true,
            exclude: 'node_modules/**',
            ...babelConfig()
        }),
    ],
    external: [
        ...Object.keys(pkgJSON.dependencies || {}),
        ...Object.keys(pkgJSON.peerDependencies || {}),
    ],
};

/**
 * ES module output configuration
 */
const esmModuleOutput = function() {
    return {
        file: path.resolve(process.cwd(), pkgJSON['jsnext:main']),
        format: 'es',
    };
};

// Let's skip ES Modules in production environment
if (pkgJSON['jsnext:main'] && process.env.NODE_ENV !== 'release') {
    config.output.push(esmModuleOutput());
}

if (process.env.NODE_ENV === 'release') {
    config.plugins.push(terser({
        mangle: {
            toplevel: true,
        },
    }));
}

export default config;
