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
/*eslint no-unused-vars: "off"*/
import { BlockCallExpression } from 'melody-extension-core';
import {
    StringLiteral,
    FilterExpression,
    MemberExpression,
    NumericLiteral,
    Identifier,
} from 'melody-types';

export default {
    ExtendsStatement(path) {
        const parentName = path.node.parentName;
        path.remove();
        this.template.parentName = parentName;
    },
    FlushStatement(path) {
        // we don't have any use for flush statements
        path.remove();
    },
    SliceExpression(path) {
        path.replaceWith(
            new FilterExpression(path.node.target, new Identifier('slice'), [
                path.node.start || new NumericLiteral(0),
                path.node.end ||
                    new MemberExpression(
                        path.node.target,
                        new Identifier('length')
                    ),
            ])
        );
    },
};
