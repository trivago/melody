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
import { explode } from './visitors';
import TraversalContext from './TraversalContext';

export function traverse(
    parentNode,
    visitor: Object,
    scope?: Object,
    state?: Object = {},
    parentPath?: Object
) {
    if (!parentNode) {
        return;
    }

    explode(visitor);
    visit(parentNode, visitor, scope, state, parentPath);
}

export function visit(node, visitor, scope, state, parentPath) {
    const keys: Array<String> = node.visitorKeys;
    if (!keys || !keys.length) {
        return;
    }

    const context = new TraversalContext(scope, visitor, state, parentPath);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        if (context.visit(node, key)) {
            return;
        }
    }
}
