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
import { ALIAS_TO_TYPE } from 'melody-types';

const EXPLODED = Symbol();

export function explode(visitor) {
    if (visitor[EXPLODED]) {
        return visitor;
    }
    visitor[EXPLODED] = true;

    for (const key of Object.getOwnPropertyNames(visitor)) {
        // make sure all members are objects with enter and exit methods
        let fns = visitor[key];
        if (typeof fns === 'function') {
            fns = visitor[key] = { enter: fns };
        }

        // make sure enter and exit are arrays
        if (fns.enter && !Array.isArray(fns.enter)) {
            fns.enter = [fns.enter];
        }
        if (fns.exit && !Array.isArray(fns.exit)) {
            fns.exit = [fns.exit];
        }
    }

    let j = 0;
    const visitorKeys = Object.getOwnPropertyNames(visitor);
    const visitorKeyLength = visitorKeys.length;
    for (; j < visitorKeyLength; j++) {
        const key = visitorKeys[j];
        // manage aliases
        if (ALIAS_TO_TYPE[key]) {
            let i = 0;
            for (
                const types = ALIAS_TO_TYPE[key], len = types.length;
                i < len;
                i++
            ) {
                const type = types[i];
                if (!visitor[type]) {
                    visitor[type] = { enter: [] };
                }
                if (visitor[key].enter) {
                    visitor[type].enter.push(...visitor[key].enter);
                }
                if (visitor[key].exit) {
                    if (!visitor[type].exit) {
                        visitor[type].exit = [];
                    }
                    visitor[type].exit.push(...visitor[key].exit);
                }
            }
            delete visitor[key];
        }
    }
}

export function merge(...visitors: Array) {
    const rootVisitor = {};

    let i = 0;
    for (const len = visitors.length; i < len; i++) {
        const visitor = visitors[i];
        explode(visitor);

        let j = 0;
        const visitorTypes = Object.getOwnPropertyNames(visitor);
        for (
            const numberOfTypes = visitorTypes.length;
            j < numberOfTypes;
            j++
        ) {
            const key = visitorTypes[j];
            const visitorType = visitor[key];

            if (!rootVisitor[key]) {
                rootVisitor[key] = {};
            }

            const nodeVisitor = rootVisitor[key];
            nodeVisitor.enter = [].concat(
                nodeVisitor.enter || [],
                visitorType.enter || []
            );
            nodeVisitor.exit = [].concat(
                nodeVisitor.exit || [],
                visitorType.exit || []
            );
        }
    }

    return rootVisitor;
}
