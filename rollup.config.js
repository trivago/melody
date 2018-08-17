import fs from 'fs';
import path from 'path';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import { uglify } from 'rollup-plugin-uglify';

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
            exclude: 'node_modules/**',
            plugins: ['external-helpers'],
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
if (pkgJSON['jsnext:main'] && process.env.NODE_ENV !== 'production') {
    config.output.push(esmModuleOutput());
}

if (process.env.NODE_ENV === 'production') {
    config.plugins.push(
        uglify({
            mangle: {
                toplevel: true,
            },
        })
    );
}

export default config;
