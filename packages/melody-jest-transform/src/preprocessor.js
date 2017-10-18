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
import { compile, toString } from 'melody-compiler';
import * as babel from 'babel-core';
import { extension as CoreExtension } from 'melody-extension-core';
import idomPlugin from 'melody-plugin-idom';
import * as p from 'process';
import findBabelConfig from 'find-babel-config';

export function getBabelConf() {
    const { config } = findBabelConfig.sync(p.cwd());

    if (!config) {
        throw new Error(
            'Couldn\'t find .babelrc or babel entry on package.json! You can specify custom config with "transformer". Please consult documentation.',
        );
    }
    return config;
}

export function process(src, path) {
    transformer(src, path);
}

export function transformer(src, path, options = {}) {
    const plugins = options.plugins || [CoreExtension, idomPlugin];
    const babelConfig = options.babel || getBabelConf();

    const compiledMelody = toString(compile(path, src, ...plugins), src).code;
    if (options.noBabel) {
        return compiledMelody;
    }

    return babel.transform(compiledMelody, babelConfig).code;
}
