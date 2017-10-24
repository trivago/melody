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

export default {
    convert: {
        TestEvenExpression: {
            exit(path) {
                const expr = t.unaryExpression(
                    '!',
                    t.binaryExpression(
                        '%',
                        path.get('expression').node,
                        t.numericLiteral(2)
                    )
                );
                expr.extra = { parenthesizedArgument: true };
                path.replaceWithJS(expr);
            },
        },
        TestOddExpression: {
            exit(path) {
                const expr = t.unaryExpression(
                    '!',
                    t.unaryExpression(
                        '!',
                        t.binaryExpression(
                            '%',
                            path.get('expression').node,
                            t.numericLiteral(2)
                        )
                    )
                );
                expr.extra = { parenthesizedArgument: true };
                path.replaceWithJS(expr);
            },
        },
        TestDefinedExpression: {
            exit(path) {
                path.replaceWithJS(
                    t.binaryExpression(
                        '!==',
                        t.unaryExpression(
                            'typeof',
                            path.get('expression').node
                        ),
                        t.stringLiteral('undefined')
                    )
                );
            },
        },
        TestEmptyExpression: {
            exit(path) {
                path.replaceWithJS(
                    t.callExpression(
                        t.identifier(
                            this.addImportFrom('melody-runtime', 'isEmpty')
                        ),
                        [path.get('expression').node]
                    )
                );
            },
        },
        TestSameAsExpression: {
            exit(path) {
                path.replaceWithJS(
                    t.binaryExpression(
                        '===',
                        path.get('expression').node,
                        path.get('arguments')[0].node
                    )
                );
            },
        },
        TestNullExpression: {
            exit(path) {
                path.replaceWithJS(
                    t.binaryExpression(
                        '===',
                        path.get('expression').node,
                        t.nullLiteral()
                    )
                );
            },
        },
        TestDivisibleByExpression: {
            exit(path) {
                path.replaceWithJS(
                    t.unaryExpression(
                        '!',
                        t.binaryExpression(
                            '%',
                            path.get('expression').node,
                            path.node.arguments[0]
                        )
                    )
                );
            },
        },
        TestIterableExpression: {
            exit(path) {
                path.replaceWithJS(
                    t.callExpression(
                        t.memberExpression(
                            t.identifier('Array'),
                            t.identifier('isArray')
                        ),
                        [path.node.expression]
                    )
                );
            },
        },
    },
};
