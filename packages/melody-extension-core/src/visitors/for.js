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
import { traverse } from 'melody-traverse';
import * as t from 'babel-types';
import babelTemplate from 'babel-template';

// @param template
// @returns function
//     @param context context bindings
//     @returns {exprStmt, initDecl, forStmt}
const template = tpl => {
    return ctx => parseExpr(babelTemplate(tpl)(ctx));
};

const forWithContext = template(`
{
let SEQUENCE = SOURCE,
KEY_TARGET = 0,
LENGTH = SEQUENCE.length,
SUB_CONTEXT = CREATE_SUB_CONTEXT(CONTEXT, {
    VALUE_TARGET: SEQUENCE[0],
    loop: {
        index: 1,
        index0: 0,
        length: LENGTH,
        revindex: LENGTH,
        revindex0: LENGTH - 1,
        first: true,
        last: 1 === LENGTH
    }
});
for (;
    KEY_TARGET < LENGTH;
    KEY_TARGET++
) {
    SUB_CONTEXT.loop.index0++;
    SUB_CONTEXT.loop.index++;
    SUB_CONTEXT.loop.revindex--;
    SUB_CONTEXT.loop.revindex0--;
    SUB_CONTEXT.loop.first = false;
    SUB_CONTEXT.loop.last = SUB_CONTEXT.loop.revindex === 0;
    SUB_CONTEXT.VALUE_TARGET = _sequence[KEY_TARGET + 1];
}
}
`);

const basicFor = template(`
{
let SEQUENCE = SOURCE,
KEY_TARGET = 0,
LENGTH = SEQUENCE.length,
VALUE_TARGET = SEQUENCE[0];
for (;
    KEY_TARGET < LENGTH;
    KEY_TARGET++,
    VALUE_TARGET = SEQUENCE[_index]
) {
}
}
`);

const localFor = template(`
{
let SEQUENCE = SOURCE,
KEY_TARGET = 0,
LENGTH = SEQUENCE.length,
VALUE_TARGET = SEQUENCE[0],
INDEX_BY_1 = 1,
REVERSE_INDEX_BY_1 = LENGTH,
REVERSE_INDEX = LENGTH - 1,
FIRST = true,
LAST = 1 === LENGTH;
for (;
    KEY_TARGET < LENGTH;
    KEY_TARGET++,
    VALUE_TARGET = SEQUENCE[_index]
) {
    INDEX_BY_1++;
    REVERSE_INDEX_BY_1--;
    REVERSE_INDEX--;
    FIRST = false;
    LAST = REVERSE_INDEX === 0;
}
}
`);

// returns an object that has the whole expression, init declarations, for loop
// statement in respective properties.
function parseExpr(exprStmt) {
    return {
        exprStmt: exprStmt,
        initDecl: exprStmt.body[0].declarations,
        forStmt: exprStmt.body[1],
    };
}

export default {
    analyse: {
        ForStatement: {
            enter(path) {
                const forStmt = path.node,
                    scope = path.scope;
                if (forStmt.keyTarget) {
                    scope.registerBinding(
                        forStmt.keyTarget.name,
                        path.get('keyTarget'),
                        'var'
                    );
                }
                if (forStmt.valueTarget) {
                    scope.registerBinding(
                        forStmt.valueTarget.name,
                        path.get('valueTarget'),
                        'var'
                    );
                }
                scope.registerBinding('loop', path, 'var');
            },
            exit(path) {
                const sequenceName = path.scope.generateUid('sequence'),
                    lenName = path.scope.generateUid('length');
                path.scope.registerBinding(sequenceName, path, 'var');
                path.scope.registerBinding(lenName, path, 'var');
                let iName;
                if (path.node.keyTarget) {
                    iName = path.node.keyTarget.name;
                } else {
                    iName = path.scope.generateUid('index0');
                    path.scope.registerBinding(iName, path, 'var');
                }
                path.setData('forStatement.variableLookup', {
                    sequenceName,
                    lenName,
                    iName,
                });

                if (path.scope.escapesContext) {
                    const contextName = path.scope.generateUid('context');
                    path.scope.registerBinding(contextName, path, 'const');
                    path.scope.contextName = contextName;
                    path.scope.getBinding('loop').kind = 'context';
                    if (path.node.valueTarget) {
                        path.scope.getBinding(path.node.valueTarget.name).kind =
                            'context';
                    }
                } else if (path.scope.getBinding('loop').references) {
                    const indexName = path.scope.generateUid('index');
                    path.scope.registerBinding(indexName, path, 'var');
                    const revindexName = path.scope.generateUid('revindex');
                    path.scope.registerBinding(revindexName, path, 'var');
                    const revindex0Name = path.scope.generateUid('revindex0');
                    path.scope.registerBinding(revindex0Name, path, 'var');
                    const firstName = path.scope.generateUid('first');
                    path.scope.registerBinding(firstName, path, 'var');
                    const lastName = path.scope.generateUid('last');
                    path.scope.registerBinding(lastName, path, 'var');

                    const lookupTable = {
                        index: indexName,
                        index0: iName,
                        length: lenName,
                        revindex: revindexName,
                        revindex0: revindex0Name,
                        first: firstName,
                        last: lastName,
                    };
                    path.setData('forStatement.loopLookup', lookupTable);

                    const loopBinding = path.scope.getBinding('loop');
                    for (const loopPath of loopBinding.referencePaths) {
                        const memExpr = loopPath.parentPath;

                        if (memExpr.is('MemberExpression')) {
                            const typeName = memExpr.node.property.name;
                            if (typeName === 'index0') {
                                memExpr.replaceWithJS({
                                    type: 'BinaryExpression',
                                    operator: '-',
                                    left: {
                                        type: 'Identifier',
                                        name: indexName,
                                    },
                                    right: { type: 'NumericLiteral', value: 1 },
                                    extra: {
                                        parenthesized: true,
                                    },
                                });
                            } else {
                                memExpr.replaceWithJS({
                                    type: 'Identifier',
                                    name: lookupTable[typeName],
                                });
                            }
                        }
                    }
                }
            },
        },
    },
    convert: {
        ForStatement: {
            enter(path) {
                if (path.scope.escapesContext) {
                    var parentContextName = path.scope.parent.contextName;
                    if (path.node.otherwise) {
                        const alternate = path.get('otherwise');
                        if (alternate.is('Scope')) {
                            alternate.scope.contextName = parentContextName;
                        }
                    }

                    const sequence = path.get('sequence');

                    if (sequence.is('Identifier')) {
                        sequence.setData(
                            'Identifier.contextName',
                            parentContextName
                        );
                    } else {
                        traverse(path.node.sequence, {
                            Identifier(id) {
                                id.setData(
                                    'Identifier.contextName',
                                    parentContextName
                                );
                            },
                        });
                    }
                }
            },
            exit(path) {
                const node = path.node;
                const { sequenceName, lenName, iName } = path.getData(
                    'forStatement.variableLookup'
                );
                let expr;
                if (path.scope.escapesContext) {
                    const contextName = path.scope.contextName;
                    expr = forWithContext({
                        CONTEXT: t.identifier(path.scope.parent.contextName),
                        SUB_CONTEXT: t.identifier(contextName),
                        CREATE_SUB_CONTEXT: t.identifier(
                            this.addImportFrom(
                                'melody-runtime',
                                'createSubContext'
                            )
                        ),
                        KEY_TARGET: t.identifier(iName),
                        SOURCE: path.get('sequence').node,
                        SEQUENCE: t.identifier(sequenceName),
                        LENGTH: t.identifier(lenName),
                        VALUE_TARGET: node.valueTarget,
                    });
                    if (node.keyTarget) {
                        expr.forStmt.body.body.push({
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'AssignmentExpression',
                                operator: '=',
                                left: {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'Identifier',
                                        name: contextName,
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: node.keyTarget.name,
                                    },
                                    computed: false,
                                },
                                right: {
                                    type: 'Identifier',
                                    name: iName,
                                },
                            },
                        });
                        expr.initDecl[
                            expr.initDecl.length - 1
                        ].init.arguments[1].properties.push({
                            type: 'ObjectProperty',
                            method: false,
                            shorthand: false,
                            computed: false,
                            key: {
                                type: 'Identifier',
                                name: node.keyTarget.name,
                            },
                            value: {
                                type: 'Identifier',
                                name: iName,
                            },
                        });
                    }
                } else if (path.scope.getBinding('loop').references) {
                    const {
                        index: indexName,
                        revindex: revindexName,
                        revindex0: revindex0Name,
                        first: firstName,
                        last: lastName,
                    } = path.getData('forStatement.loopLookup');

                    expr = localFor({
                        KEY_TARGET: t.identifier(iName),
                        SOURCE: path.get('sequence').node,
                        SEQUENCE: t.identifier(sequenceName),
                        LENGTH: t.identifier(lenName),
                        VALUE_TARGET: node.valueTarget,
                        INDEX_BY_1: t.identifier(indexName),
                        REVERSE_INDEX: t.identifier(revindex0Name),
                        REVERSE_INDEX_BY_1: t.identifier(revindexName),
                        FIRST: t.identifier(firstName),
                        LAST: t.identifier(lastName),
                    });
                } else {
                    expr = basicFor({
                        SEQUENCE: t.identifier(sequenceName),
                        SOURCE: path.get('sequence').node,
                        KEY_TARGET: t.identifier(iName),
                        LENGTH: t.identifier(lenName),
                        VALUE_TARGET: node.valueTarget,
                    });
                }

                expr.forStmt.body.body.unshift(...path.get('body').node.body);

                let uniteratedName;
                if (node.otherwise) {
                    uniteratedName = path.scope.generateUid('uniterated');
                    path.scope.parent.registerBinding(
                        uniteratedName,
                        path,
                        'var'
                    );
                    expr.forStmt.body.body.push(
                        t.expressionStatement(
                            t.assignmentExpression(
                                '=',
                                t.identifier(uniteratedName),
                                t.booleanLiteral(false)
                            )
                        )
                    );
                }

                if (node.condition) {
                    expr.forStmt.body = t.blockStatement([
                        {
                            type: 'IfStatement',
                            test: node.condition,
                            consequent: t.blockStatement(
                                expr.forStmt.body.body
                            ),
                        },
                    ]);
                }

                if (uniteratedName) {
                    path.replaceWithMultipleJS(
                        t.variableDeclaration('let', [
                            t.variableDeclarator(
                                t.identifier(uniteratedName),
                                t.booleanLiteral(true)
                            ),
                        ]),
                        expr.exprStmt,
                        t.ifStatement(
                            t.identifier(uniteratedName),
                            node.otherwise
                        )
                    );
                } else {
                    path.replaceWithJS(expr.exprStmt);
                }
            },
        },
    },
};
