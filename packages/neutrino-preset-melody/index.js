const web = require('neutrino-preset-web');
const compileLoader = require('neutrino-middleware-compile-loader');
const loaderMerge = require('neutrino-middleware-loader-merge');
const { join } = require('path');
const merge = require('deepmerge');

const MODULES = join(__dirname, 'node_modules');

module.exports = (neutrino, opts = {}) => {
    const options = merge(
        {
            babel: {},
        },
        opts
    );

    Object.assign(options, {
        babel: compileLoader.merge(
            {
                plugins: [
                    require.resolve(
                        'babel-plugin-transform-object-rest-spread'
                    ),
                    ...(process.env.NODE_ENV !== 'development'
                        ? [
                              [
                                  require.resolve(
                                      'babel-plugin-transform-class-properties'
                                  ),
                                  { spec: true },
                              ],
                          ]
                        : []),
                ],
                env: {
                    development: {
                        plugins: [
                            [
                                require.resolve(
                                    'babel-plugin-transform-class-properties'
                                ),
                                { spec: true },
                            ],
                            require.resolve(
                                'babel-plugin-transform-es2015-classes'
                            ),
                        ],
                    },
                },
            },
            options.babel
        ),
    });

    neutrino.use(web, options);

    neutrino.config.module
        .rule('twig')
        .test(/(.melody)?.twig$/)
        .use('melody-loader')
        .loader(require.resolve('melody-loader'))
        .options({
            plugins: [
                {
                    options: {
                        embedSvgAsMelody: true,
                    },
                },
                'idom',
            ],
        });

    neutrino.config.resolve.modules
        .add(MODULES)
        .end()
        .end()
        .resolveLoader.modules.add(MODULES)
        .end()
        .end()
        .externals({});
};
