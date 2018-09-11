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
import * as t from 'babel-types';
import template from 'babel-template';

// use default value if var is null, undefined or an empty string
// but use var if value is 0, false, an empty array or an empty object
const defaultFilter = template("VAR != null && VAR !== '' ? VAR : DEFAULT");

export default {
    capitalize: 'lodash',
    first: 'lodash',
    last: 'lodash',
    keys: 'lodash',
    default(path) {
        // babel-template transforms it to an expression statement
        // but we really need an expression here, so unwrap it
        path.replaceWithJS(
            defaultFilter({
                VAR: path.node.target,
                DEFAULT: path.node.arguments[0] || t.stringLiteral(''),
            }).expression
        );
    },
    abs(path) {
        // todo throw error if arguments exist
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(t.identifier('Math'), t.identifier('abs')),
                [path.node.target]
            )
        );
    },
    join(path) {
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(path.node.target, t.identifier('join')),
                path.node.arguments
            )
        );
    },
    json_encode(path) {
        // todo: handle arguments
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(
                    t.identifier('JSON'),
                    t.identifier('stringify')
                ),
                [path.node.target]
            )
        );
    },
    length(path) {
        path.replaceWithJS(
            t.memberExpression(path.node.target, t.identifier('length'))
        );
    },
    lower(path) {
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(
                    path.node.target,
                    t.identifier('toLowerCase')
                ),
                []
            )
        );
    },
    upper(path) {
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(
                    path.node.target,
                    t.identifier('toUpperCase')
                ),
                []
            )
        );
    },
    slice(path) {
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(path.node.target, t.identifier('slice')),
                path.node.arguments
            )
        );
    },
    sort(path) {
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(path.node.target, t.identifier('sort')),
                path.node.arguments
            )
        );
    },
    split(path) {
        path.replaceWithJS(
            t.callExpression(
                t.memberExpression(path.node.target, t.identifier('split')),
                path.node.arguments
            )
        );
    },
    convert_encoding(path) {
        // encoding conversion is not supported
        path.replaceWith(path.node.target);
    },
    date_modify(path) {
        path.replaceWithJS(
            t.callExpression(
                t.identifier(
                    path.state.addImportFrom('melody-runtime', 'strtotime')
                ),
                [path.node.arguments[0], path.node.target]
            )
        );
    },
    date(path) {
        // Not really happy about this since moment.js could well be incompatible with
        // the default twig behaviour
        // might need to switch to an actual strftime implementation
        path.replaceWithJS(
            t.callExpression(
                t.callExpression(
                    t.identifier(path.state.addDefaultImportFrom('moment')),
                    [path.node.target]
                ),
                [path.node.arguments[0]]
            )
        );
    },
};
