/**
 * Copyright 2017 trivago N.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import webpack from 'webpack';
import { readFile, mkdtemp } from 'mz/fs';
import { join, resolve } from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';

// eslint-disable-next-line no-undef
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
const TMP_DIR = resolve(__dirname, '.tmp');

beforeAll(async () => {
    await new Promise((res, rej) => {
        mkdirp(TMP_DIR, err => {
            return err ? rej(err) : res();
        });
    });
});

afterAll(async () => {
    await new Promise((res, rej) => {
        rimraf(TMP_DIR, err => {
            return err ? rej(err) : res();
        });
    });
});

describe('melody-loader intergration tests', async () => {
    test('transforms melody template to js', async () => {
        const compiler = await createCompiler({
            context: resolve(__dirname, '../__fixtures__/simple'),
            entry: {
                main: './index.js',
            },
        });
        const stats = await run(compiler);
        const asset = stats.compilation.assets['main.js'];
        const assetContent = await readFile(asset.existsAt, 'utf8');
        expect(assetContent).toMatchSnapshot();
    });
});

async function run(compiler) {
    return new Promise((res, rej) => {
        compiler.run((err, stats) => {
            if (err) {
                return rej(err);
            }

            throwOnErrors(stats);
            res(stats);
        });
    });
}

function throwOnErrors(stats) {
    const errors = stats.compilation.errors;
    if (errors.length > 0) {
        throw new Error(errors[0]);
    }
}

async function createConfig({ context, entry }) {
    const outputDir = await mkdtemp(join(TMP_DIR, '/'));

    return {
        context,
        entry,
        output: {
            path: outputDir,
            filename: '[name].js',
            chunkFilename: '[chunkhash].js',
        },
        plugins: [
            new webpack.optimize.CommonsChunkPlugin({
                name: 'vendor',
                minChunks: module => {
                    // put everything into vendor except the fixture
                    // assets
                    return (
                        module.resource && !/__fixtures__/.test(module.resource)
                    );
                },
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.melody\.twig$/,
                    use: [
                        {
                            loader: require.resolve('../src/index'),
                            options: {
                                plugins: ['idom'],
                            },
                        },
                    ],
                },
            ],
        },
    };
}

async function createCompiler({ context, entry }) {
    const config = await createConfig({ context, entry });
    return webpack(config);
}
