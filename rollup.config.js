import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import uglify from 'rollup-plugin-uglify';

var plugins = [json(), babel()];

if (process.env.NODE_ENV === 'production') {
    plugins.push(
        uglify({
            mangle: {
                toplevel: true,
            },
        })
    );
}

export default {
    format: 'cjs',
    plugins: plugins,
};
