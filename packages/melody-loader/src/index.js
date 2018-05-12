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
import { toString, compile } from 'melody-compiler';
import { extension as CoreExtension } from 'melody-extension-core';
import { getOptions } from 'loader-utils';
import { isString, isObject } from 'lodash';

module.exports = function loader(content) {
    this.cacheable();

    const loaderOptions = getOptions(this) || {
        plugins: [],
    };
    // configuring logger using webpack logging mechanism.
    CoreExtension.options = {
        warn: this.emitWarning,
        error: this.emitError,
    };
    const args = [this.resourcePath, content, CoreExtension];
    if (loaderOptions.plugins) {
        for (const pluginName of loaderOptions.plugins) {
            if (isString(pluginName)) {
                try {
                    args.push(require('melody-plugin-' + pluginName));
                } catch (e) {
                    this.emitWarning(
                        'Could not find plugin ' +
                            pluginName +
                            '. Expected name to be melody-plugin-' +
                            pluginName
                    );
                }
            } else if (isObject(pluginName)) {
                args.push(pluginName);
            } else {
                this.emitWarning(
                    'Value passed as Melody plugin must be string or object. ' +
                        pluginName +
                        ' of type ' +
                        typeof pluginName +
                        ' was given'
                );
            }
        }
    }

    try {
        const result = toString(compile.apply(null, args), content);
        return result.code;
    } catch (e) {
        this.emitError(e);
        return (
            'import {text} from "melody-idom"; export default { render(options) { text("Could not load ' +
            this.resourcePath +
            '"); console.error("Could not load ' +
            this.resourcePath +
            '", ' +
            JSON.stringify(e.message) +
            '); } };'
        );
    }
};
