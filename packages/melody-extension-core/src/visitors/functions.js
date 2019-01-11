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

function addOne(expr) {
    return t.binaryExpression('+', expr, t.numericLiteral(1));
}

export default {
    range(path) {
        const args = path.node.arguments;
        const callArgs = [];
        if (args.length === 1) {
            callArgs.push(addOne(args[0]));
        } else if (args.length === 3) {
            callArgs.push(args[0]);
            callArgs.push(addOne(args[1]));
            callArgs.push(args[2]);
        } else if (args.length === 2) {
            callArgs.push(args[0], addOne(args[1]));
        } else {
            path.state.error(
                'Invalid range call',
                path.node.pos,
                `The range function accepts 1 to 3 arguments but you have specified ${
                    args.length
                } arguments instead.`
            );
        }

        path.replaceWithJS(
            t.callExpression(
                t.identifier(path.state.addImportFrom('lodash', 'range')),
                callArgs
            )
        );
    },
    // range: 'lodash',
    dump(path) {
        if (!path.parentPath.is('PrintExpressionStatement')) {
            path.state.error(
                'dump must be used in a lone expression',
                path.node.pos,
                'The dump function does not have a return value. Thus it must be used as the only expression.'
            );
        }
        path.parentPath.replaceWithJS(
            t.expressionStatement(
                t.callExpression(
                    t.memberExpression(
                        t.identifier('console'),
                        t.identifier('log')
                    ),
                    path.node.arguments
                )
            )
        );
    },
    include(path) {
        if (!path.parentPath.is('PrintExpressionStatement')) {
            path.state.error({
                title: 'Include function does not return value',
                pos: path.node.loc.start,
                advice: `The include function currently does not return a value.
                Thus you must use it like a regular include tag.`,
            });
        }
        const includeName = path.scope.generateUid('include');
        const importDecl = t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(includeName))],
            path.node.arguments[0]
        );
        path.state.program.body.splice(0, 0, importDecl);
        path.scope.registerBinding(includeName);

        const argument = path.node.arguments[1];

        const includeCall = t.expressionStatement(
            t.callExpression(
                t.memberExpression(
                    t.identifier(includeName),
                    t.identifier('render')
                ),
                argument ? [argument] : []
            )
        );
        path.replaceWithJS(includeCall);
    },
};
