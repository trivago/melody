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
export function inheritBlocks(template, usedTemplate, mappings) {
    for (const name in usedTemplate) {
        if (!usedTemplate.hasOwnProperty(name)) {
            continue;
        }

        if (name !== 'render') {
            if (mappings) {
                const mappedName =
                    mappings[
                        name.substring(0, 7) +
                            name[7].toLowerCase() +
                            name.substring(8)
                    ];
                if (mappedName) {
                    template[mappedName] = usedTemplate[name];
                }
            } else {
                template[name] = usedTemplate[name];
            }
        }
    }
}

export function isEmpty(val) {
    return val !== 0 && (!val || (Array.isArray(val) && !val.length));
}
