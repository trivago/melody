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
import { Fragment } from 'melody-types';
import * as t from 'babel-types';
import { isString, isFunction } from 'lodash';

var operatorMap = {
    or: '||',
    and: '&&',
    'b-or': '|',
    'b-xor': '^',
    'b-and': '&',
};

export default {
    UnaryNotExpression: {
        exit(path) {
            path.replaceWithJS(t.unaryExpression('!', path.node.argument));
        },
    },
    UnaryExpression: {
        exit(path) {
            path.replaceWithJS(
                t.unaryExpression(path.node.operator, path.get('argument').node)
            );
        },
    },
    BinaryConcatExpression: {
        exit(path) {
            const node = path.node;
            path.replaceWithJS({
                type: 'BinaryExpression',
                operator: '+',
                left: node.left,
                right: node.right,
            });
        },
    },
    BinaryPowerExpression: {
        exit(path) {
            path.replaceWithJS(
                t.callExpression(
                    t.memberExpression(
                        t.identifier('Math'),
                        t.identifier('pow')
                    ),
                    [path.get('left').node, path.get('right').node]
                )
            );
        },
    },
    BinaryNullCoalesceExpression: {
        exit(path) {
            path.replaceWithJS(
                t.conditionalExpression(
                    t.binaryExpression(
                        '!=',
                        path.get('left').node,
                        t.nullLiteral()
                    ),
                    path.get('left').node,
                    path.get('right').node
                )
            );
        },
    },
    BinaryFloorDivExpression: {
        exit(path) {
            path.replaceWithJS(
                t.callExpression(
                    t.identifier(this.addImportFrom('melody-runtime', 'round')),
                    [
                        t.binaryExpression(
                            '/',
                            path.get('left').node,
                            path.get('right').node
                        ),
                        t.numericLiteral(0),
                        t.stringLiteral('floor'),
                    ]
                )
            );
        },
    },
    BinaryNotInExpression: {
        exit(path) {
            path.replaceWithJS(
                t.unaryExpression(
                    '!',
                    t.callExpression(
                        t.identifier(this.addImportFrom('lodash', 'includes')),
                        [path.get('right').node, path.get('left').node]
                    )
                )
            );
        },
    },
    BinaryInExpression: {
        exit(path) {
            path.replaceWithJS(
                t.callExpression(
                    t.identifier(this.addImportFrom('lodash', 'includes')),
                    [path.get('right').node, path.get('left').node]
                )
            );
        },
    },
    BinaryStartsWithExpression: {
        exit(path) {
            path.replaceWithJS(
                t.callExpression(
                    t.identifier(this.addImportFrom('lodash', 'startsWith')),
                    [path.get('left').node, path.get('right').node]
                )
            );
        },
    },
    BinaryEndsWithExpression: {
        exit(path) {
            path.replaceWithJS(
                t.callExpression(
                    t.identifier(this.addImportFrom('lodash', 'endsWith')),
                    [path.get('left').node, path.get('right').node]
                )
            );
        },
    },
    BinaryRangeExpression: {
        exit(path) {
            path.replaceWithJS(
                t.callExpression(
                    t.identifier(this.addImportFrom('lodash', 'range')),
                    [path.get('left').node, path.get('right').node]
                )
            );
        },
    },
    BinaryMatchesExpression: {
        exit(path) {
            const right = path.get('right'),
                pattern = right.is('StringLiteral')
                    ? t.regExpLiteral(right.node.value)
                    : right.node;
            path.replaceWithJS(
                t.unaryExpression(
                    '!',
                    t.unaryExpression(
                        '!',
                        t.callExpression(
                            t.memberExpression(
                                path.get('left').node,
                                t.identifier('match')
                            ),
                            [pattern]
                        )
                    )
                )
            );
        },
    },
    BinaryExpression: {
        exit(path) {
            const node = path.node;
            path.replaceWithJS({
                type: 'BinaryExpression',
                operator: operatorMap[node.operator] || node.operator,
                left: node.left,
                right: node.right,
            });
        },
    },
    CallExpression: {
        exit(path) {
            const callee = path.get('callee');
            if (callee.is('Identifier')) {
                const functionName = callee.node.name,
                    binding = callee.scope.getBinding(functionName);
                if (binding) {
                    if (
                        binding.kind === 'macro' &&
                        path.parentPath.is('PrintStatement')
                    ) {
                        path.parentPath.replaceWith(
                            new Fragment(
                                t.callExpression(
                                    t.identifier(functionName),
                                    path.node.arguments
                                )
                            )
                        );
                    } else if (binding.kind === 'function') {
                        const functionSource = this.functionMap[functionName];
                        if (isString(functionSource)) {
                            callee.node.name = this.addImportFrom(
                                functionSource,
                                functionName
                            );
                        } else if (isFunction(functionSource)) {
                            functionSource(path);
                        }
                    }
                }
            }
        },
    },
    ConditionalExpression: {
        exit(path) {
            const node = path.node;
            if (!node.alternate) {
                node.alternate = t.stringLiteral('');
            } else if (!node.consequent) {
                path.replaceWithJS({
                    type: 'LogicalExpression',
                    operator: '||',
                    left: node.test,
                    right: node.alternate,
                });
            }
        },
    },
    SequenceExpression: {
        exit(path) {
            path.replaceWithJS({
                type: 'BlockStatement',
                body: path.node.expressions,
            });
        },
    },
    DoStatement: {
        exit(path) {
            path.replaceWithJS(t.expressionStatement(path.node.value));
        },
    },
    BinaryAndExpression: {
        exit(path) {
            path.node.operator = '&&';
        },
    },
    BinaryOrExpression: {
        exit(path) {
            path.node.operator = '||';
        },
    },
    FilterExpression: {
        exit(path) {
            const expr = path.node,
                filterSource = this.filterMap[expr.name.name];
            if (!filterSource) {
                return;
            }
            if (isString(filterSource)) {
                path.replaceWithJS(
                    t.callExpression(
                        t.identifier(
                            this.addImportFrom(filterSource, expr.name.name)
                        ),
                        [expr.target, ...expr.arguments]
                    )
                );
            } else if (isFunction(filterSource)) {
                filterSource.call(this, path);
            }
        },
    },
    IfStatement: {
        exit(path) {
            path.node.consequent = t.blockStatement(path.node.consequent);
            if (path.node.alternate && Array.isArray(path.node.alternate)) {
                path.node.alternate = t.blockStatement(path.node.alternate);
            }
        },
    },
    VariableDeclarationStatement: {
        exit(path) {
            const node = path.node;
            const binding = path.scope.getBinding(node.name.name);
            if (
                path.scope.escapesContext ||
                (binding && binding.shadowedBinding)
            ) {
                path.replaceWithJS(
                    t.assignmentExpression(
                        '=',
                        t.memberExpression(
                            t.identifier(path.scope.contextName),
                            node.name
                        ),
                        node.value
                    )
                );
            } else {
                path.replaceWithJS(
                    t.assignmentExpression('=', node.name, node.value)
                );
            }
        },
    },
    SetStatement: {
        exit(path) {
            const assignments = [];
            const replacements = [];
            for (const expr of (path.node.assignments: Array)) {
                if (t.isAssignmentExpression) {
                    assignments.push(expr);
                } else {
                    // todo better error handling
                    throw new Error(
                        'Must be variable declaration or assignment'
                    );
                }
            }
            if (assignments.length) {
                replacements.push(
                    ...path.node.assignments.map(expr =>
                        t.expressionStatement(expr)
                    )
                );
            }
            path.replaceWithMultipleJS(...replacements);
        },
    },
};
