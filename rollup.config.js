import fs from 'fs';
import path from 'path';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

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
            format: 'es',
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

// PLACEHOLDER: block to add rules for production environment
// if (process.env.NODE_ENV === 'production') { }

export default config;
