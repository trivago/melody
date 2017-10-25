# Neutrino Melody Preset

`neutrino-preset-melody` is a Neutrino preset that supports building [melody](https://melody.js.org) web applications.

## Features

- Zero configuration necessary to start developing and building a melody app
- Write twig templates without any configuration
- Extends from [neutrino-preset-web](https://neutrino.js.org/presets/neutrino-preset-web)
  - Modern Babel compilation supporting ES modules, last 2 major browser versions, async functions, and dynamic imports
  - Webpack loaders for importing HTML, CSS, images, icons, and fonts
  - Webpack Dev Server during development
  - Automatic creation of HTML pages, no templating necessary
  - Hot module replacement support
  - Production-optimized bundles with Babili minification and easy chunking
  - Easily extensible to customize your project as needed

## Requirements

- Node.js v6.10+
- Yarn or npm client
- Neutrino v6

## Installation

`neutrino-preset-melody` can be installed via the Yarn or npm clients. Inside your project, make sure
`neutrino` and `neutrino-preset-melody` are development dependencies. You will also need following for
a minimal melody development:

```bash
    melody-component
    melody-idom
    melody-parser
    melody-plugin-idom
    melody-traverse
    melody-types
```

#### Yarn

```bash
❯ yarn add --dev neutrino neutrino-preset-melody
❯ yarn add melody-component melody-idom melody-parser melody-plugin-idom melody-traverse melody-types
```

#### npm

```bash
❯ npm install --save-dev neutrino neutrino-preset-melody
❯ npm install --save melody-component melody-idom melody-parser melody-plugin-idom melody-traverse melody-types
```

## Project Layout

`neutrino-preset-melody` follows the standard [project layout](https://neutrino.js.org/project-layout) specified by Neutrino. This
means that by default all project source code should live in a directory named `src` in the root of the
project. This includes JavaScript files, CSS stylesheets, images, and any other assets that would be available
to import your compiled project.

## Quickstart

After installing Neutrino and the melody preset, add a new directory named `src` in the root of the project, with
a single JS file named `index.js` in it.

```bash
❯ mkdir src && touch src/index.js && touch src/index.twig
```

This melody preset exposes an element in the page with an ID of `root` to which you can mount your application. Edit
your `src/index.js` file with the following:

```javascript

import template from './index.twig';
import { render, createComponent, RECEIVE_PROPS } from 'melody-component';


const stateReducer = (state = { label: 'Hello world' }, {type, payload}) => {
  switch (type) {
    case RECEIVE_PROPS: {
      return {
        ...state,
        ...payload
      }
    }
    default: {
      return state;
    }
  }
}

const main = createComponent(template, stateReducer);

const root = document.getElementById('root');
render(root, main);
```

Edit your`src/index.twig` with the following:

```twig
{{- label -}}
```

Now edit your project's package.json to add commands for starting and building the application:

```json
{
  "scripts": {
    "start": "neutrino start --use neutrino-preset-melody",
    "build": "neutrino build --use neutrino-preset-melody"
  }
}
```

If you are using `.neutrinorc.js`, add this preset to your use array instead of `--use` flags:

```js
module.exports = {
  use: ['neutrino-preset-melody']
};
```

Start the app, then open a browser to the address in the console:

#### Yarn

```bash
❯ yarn start
✔ Development server running on: http://localhost:5000
✔ Build completed
```

#### npm

```bash
❯ npm start
✔ Development server running on: http://localhost:5000
✔ Build completed
```

## Building

`neutrino-preset-melody` builds static assets to the `build` directory by default when running `neutrino build`. Using
the quick start example above as a reference:

```bash
❯ yarn build

✔ Building project completed
Hash: 103df3a388384d01ebd8
Version: webpack 3.8.1
Time: 3659ms
                           Asset       Size    Chunks             Chunk Names
   index.a6e0b771ad74e2311d7a.js    19.1 kB     index  [emitted]  index
polyfill.4267540a400cfdd97921.js    39.4 kB  polyfill  [emitted]  polyfill
 runtime.fcfe67376ceab8b45443.js    1.48 kB   runtime  [emitted]  runtime
                      index.html  846 bytes            [emitted]
✨  Done in 5.63s.
```

You can either serve or deploy the contents of this `build` directory as a static site.

## Static assets

If you wish to copy files to the build directory that are not imported from application code, you can place
them in a directory within `src` called `static`. All files in this directory will be copied from `src/static`
to `build/static`.

## Paths

The `neutrino-preset-web` preset loads assets relative to the path of your application by setting Webpack's
[`output.publicPath`](https://webpack.js.org/configuration/output/#output-publicpath) to `./`. If you wish to load
assets instead from a CDN, or if you wish to change to an absolute path for your application, customize your build to
override `output.publicPath`. See the [Customizing](#Customizing) section below.

## Preset options

You can provide custom options and have them merged with this preset's default options to easily affect how this
preset builds. You can modify melody preset settings from `.neutrinorc.js` by overriding with an options object. Use
an array pair instead of a string to supply these options in `.neutrinorc.js`.

The following shows how you can pass an options object to the melody preset and override its options. See the
[Web documentation](https://neutrino.js.org/presets/neutrino-preset-web#presetoptions) for specific options you can override with this object.

```js
module.exports = {
  use: [
    ['neutrino-preset-melody', {
      /* preset options */

      // Example: change the page title
      html: {
        title: 'Melody First App'
      },

      // Add additional Babel plugins, presets, or env options
      babel: {
        // Override options for babel-preset-env
        presets: [
          ['babel-preset-env', {
            // Passing in targets to babel-preset-env will replace them
            // instead of merging them
            targets: {
              browsers: [
                'last 1 Chrome versions',
                'last 1 Firefox versions'
              ]
            }
          }]
        ]
      }
    }]
  ]
};
```

## Customizing

To override the build configuration, start with the documentation on [customization](https://neutrino.js.org/customization).
`neutrino-preset-melody` does not use any additional named rules, loaders, or plugins that aren't already in use by the
Web preset. See the [Web documentation customization](https://neutrino.js.org/presets/neutrino-preset-web#customizing)
for preset-specific configuration to override.

### Advanced configuration

By following the [customization guide](https://neutrino.js.org/customization) and knowing the rule, loader, and plugin IDs from
`neutrino-preset-web`, you can override and augment the build by providing a function to your `.neutrinorc.js` use
array. You can also make these changes from the Neutrino API in custom middleware.

#### Vendoring

By defining an entry point named `vendor` you can split out external dependencies into a chunk separate
from your application code.

_Example: Put melody into a separate "vendor" chunk:_

```js
module.exports = {
  use: [
    'neutrino-preset-melody',
    (neutrino) => neutrino.config
      .entry('vendor')
        .add('melody-component')
        .add('melody-parser')
        .add('melody-plugin-idom')
        .add('melody-traverse')
        .add('melody-component')
        .add('melody-types')
        .add('melody-idom')
  ]
};
```

#### Credits
[neutrino-preset-react](https://github.com/mozilla-neutrino/neutrino-dev/tree/master/packages/neutrino-preset-react)
