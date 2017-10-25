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
function throwMissingMelodyPluginError(path) {
    this.error(
        'Missing melody plugin',
        0,
        'Cannot convert templates, since there seems to be no melody plugin to convert the template to a certain output format. You can choose for example between `melody-plugin-idom` and `melody-plugin-jsx`.'
    );
}

export default {
    Element: {
        exit(path) {
            throwMissingMelodyPluginError.call(this, path);
        },
    },
    Fragment: {
        exit(path) {
            throwMissingMelodyPluginError.call(this, path);
        },
    },
    PrintStatement: {
        exit(path) {
            throwMissingMelodyPluginError.call(this, path);
        },
    },
    FilterExpression: {
        exit(path) {
            const expr = path.node;
            const name = expr.name.name;

            const validFilters = Object.keys(this.filterMap)
                .sort()
                .map(filter => `- ${filter}`)
                .join(`\n    `);

            this.error(
                `Unknown filter "${name}"`,
                expr.name.loc.start,
                `You've tried to invoke an unknown filter called "${name}".
Some of the known filters include:

    ${validFilters}

Please report this as a bug if the filter you've tried to use is listed here:
http://twig.sensiolabs.org/doc/filters/index.html`,
                name.length
            );
        },
    },
};
