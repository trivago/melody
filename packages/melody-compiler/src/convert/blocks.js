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
import { Fragment } from 'melody-types';
import template from 'babel-template';

const buildRenderFunction = template(`
TEMPLATE.NAME = function(_context) {
  BODY
};
`);

export default {
    FromStatement(path) {
        const fromStmt = path.node,
            source = fromStmt.source;
        for (const { key, alias } of (fromStmt.imports: Array)) {
            this.addImportFrom(source.value, key.name, alias.name);
        }
        path.remove();
    },
    ImportDeclaration: {
        exit(path) {
            const { key, alias } = path.node;
            const keyPath = path.get('key');
            const parentPath = path.parentPath;
            if (
                !parentPath.is('MacroDeclaration') &&
                !parentPath.is('Template') &&
                !parentPath.is('BlockStatement')
            ) {
                throw new Error(
                    'Import must be used in macro, block or template'
                );
            }
            if (!keyPath.is('StringLiteral')) {
                if (!(keyPath.is('Identifier') && key.name === '_self')) {
                    // todo: proper error reporting
                    throw Error();
                } else {
                    const selfBinding = path.scope.getBinding(
                            path.node.alias.name
                        ),
                        macroNames = [];
                    for (const usagePath of selfBinding.referencePaths) {
                        const boundName =
                            usagePath.parentPath.node.property.name;
                        macroNames.push(
                            t.objectProperty(
                                t.identifier(boundName),
                                t.identifier(boundName),
                                false,
                                true
                            )
                        );
                    }
                    path.scope.block.body.unshift(
                        t.variableDeclaration('const', [
                            t.variableDeclarator(
                                t.identifier(selfBinding.identifier),
                                t.objectExpression(macroNames)
                            ),
                        ])
                    );
                }
            } else {
                this.addNamespaceImportFrom(key.value, alias.name);
            }
            path.remove();
        },
    },
    MacroDeclarationStatement: {
        exit(path) {
            const { node, scope } = path;
            const args = [...node.arguments];
            if (scope.getBinding('varargs').referenced) {
                args.push(t.restElement(t.identifier('varargs')));
            }
            const macroStmt = t.exportNamedDeclaration(
                t.functionDeclaration(node.name, args, node.body),
                []
            );
            path.remove();
            this.program.body.push(macroStmt);
        },
    },
    UseStatement(path) {
        const useStmt = path.node,
            source = useStmt.source;
        if (useStmt.aliases.length) {
            const members = [];
            for (const { name, alias } of (useStmt.aliases: Array)) {
                const aliasName = toBlockName(alias.name),
                    nameName = toBlockName(name.name);
                this.addImportFrom(source.value, aliasName, nameName);
                members.push(
                    t.objectProperty(
                        t.identifier(aliasName),
                        t.identifier(aliasName),
                        false,
                        true
                    )
                );
            }
            const inheritBlocks = t.expressionStatement(
                t.callExpression(
                    t.memberExpression(
                        t.identifier('Object'),
                        t.identifier('assign')
                    ),
                    [
                        t.identifier(this.templateVariableName),
                        t.objectExpression(members),
                    ]
                )
            );
            this.program.body.push(inheritBlocks);
        } else {
            const name = this.addDefaultImportFrom(
                source.value,
                path.scope.generateUid('use')
            );
            this.program.body.push(
                t.expressionStatement(
                    t.callExpression(
                        t.identifier(
                            this.addImportFrom(
                                'melody-runtime',
                                'inheritBlocks'
                            )
                        ),
                        [
                            t.identifier(this.templateVariableName),
                            t.identifier(name),
                        ]
                    )
                )
            );
        }
        path.remove();
    },
    CallExpression: {
        exit(path) {
            const callee = path.get('callee');
            if (callee.is('Identifier') && callee.node.name === 'block') {
                path.replaceWith(
                    t.expressionStatement(
                        t.callExpression(
                            t.memberExpression(
                                t.identifier('this'),
                                t.identifier(
                                    toBlockName(
                                        path.get('arguments')[0].node.value
                                    )
                                )
                            ),
                            [t.identifier(path.scope.contextName)]
                        )
                    )
                );
            } else if (
                callee.is('MemberExpression') &&
                callee.get('object').is('Identifier')
            ) {
                const name = callee.get('object').node.name;
                const binding = path.scope.getBinding(name);
                if (binding && binding.kind === 'macro') {
                    path.replaceWithJS(t.expressionStatement(path.node));
                }
            }
        },
    },
    BlockCallExpression: {
        exit(path) {
            const node = path.node;
            const callExpression = t.callExpression(
                t.memberExpression(
                    t.identifier('this'),
                    t.identifier(toBlockName(node.callee.name)),
                    true
                ),
                [t.identifier(path.scope.contextName)]
            );
            path.replaceWith(new Fragment(callExpression));
        },
    },
    BlockStatement: {
        exit(path) {
            if (path.parentPath.is('EmbedStatement')) {
                // todo implement
            } else {
                const node = path.node,
                    blockName = toBlockName(node.name.name);

                const blockScope = path.scope;
                if (blockScope.hasBinding('parent')) {
                    const bindings = blockScope.getBinding('parent');
                    for (const ref of (bindings.referencePaths: Array)) {
                        ref.replaceWithJS(
                            t.memberExpression(
                                t.identifier(this.parentName),
                                t.identifier(blockName)
                            )
                        );
                    }
                }
                if (
                    this.template.parentName &&
                    !path.findParentPathOfType('BlockStatement')
                ) {
                    // if we're in an inherited template and are not defined in
                    // another block statement
                    path.remove();
                } else {
                    const callExpression = t.callExpression(
                        t.memberExpression(
                            t.identifier('this'),
                            t.identifier(blockName)
                        ),
                        [t.identifier(path.parentPath.scope.contextName)]
                    );
                    path.replaceWith(new Fragment(callExpression));
                }
                this.program.body.push(
                    buildRenderFunction({
                        TEMPLATE: t.identifier(this.templateVariableName),
                        NAME: t.identifier(blockName),
                        BODY: node.body,
                    })
                );
            }
        },
    },
    IncludeStatement: {
        exit(path) {
            const includeName = this.addDefaultImportFrom(
                path.node.source.value,
                path.scope.generateUid('include')
            );
            path.scope.getRootScope().registerBinding(includeName);

            const node = path.node;
            let argument;

            if (node.argument) {
                if (node.contextFree) {
                    argument = node.argument;
                } else {
                    argument = t.callExpression(
                        t.identifier(
                            this.addImportFrom(
                                'melody-runtime',
                                'createSubContext'
                            )
                        ),
                        [t.identifier(path.scope.contextName), node.argument]
                    );
                }
            } else if (!node.contextFree) {
                argument = t.identifier(path.scope.contextName);
            }

            const includeCall = t.callExpression(
                t.identifier(includeName),
                argument ? [argument] : []
            );
            path.replaceWith(new Fragment(includeCall));
        },
    },
    EmbedStatement: {
        exit(path) {
            // todo: if template has parent, check that we're in a block
            const rootScope = path.scope.getRootScope();
            const embedName = rootScope.generateUid('embed');
            const importDecl = t.importDeclaration(
                [
                    t.importSpecifier(
                        t.identifier(embedName),
                        t.identifier('_template')
                    ),
                ],
                path.node.parent
            );
            this.program.body.splice(0, 0, importDecl);
            rootScope.registerBinding(embedName);

            const embeddedName = rootScope.generateUid('embed');
            rootScope.registerBinding(embeddedName);
            let lastStmt = this.insertGlobalVariableDeclaration(
                'const',
                t.identifier(embeddedName),
                t.callExpression(
                    t.memberExpression(
                        t.identifier('Object'),
                        t.identifier('create')
                    ),
                    [t.identifier(embedName)]
                )
            );
            if (path.get('blocks')) {
                for (const blockPath of (path.get('blocks'): Array)) {
                    const block = blockPath.node;
                    const blockName =
                        'render' +
                        block.name.name[0].toUpperCase() +
                        block.name.name.substring(1);
                    const stmt = t.expressionStatement(
                        t.assignmentExpression(
                            '=',
                            t.memberExpression(
                                t.identifier(embeddedName),
                                t.identifier(blockName)
                            ),
                            {
                                type: 'FunctionExpression',
                                id: null,
                                generator: false,
                                expression: false,
                                params: [t.identifier('_context')],
                                body: t.blockStatement(block.body),
                            }
                        )
                    );
                    lastStmt = this.insertAfter(stmt, lastStmt);

                    const blockScope = blockPath.scope;
                    if (blockScope.hasBinding('parent')) {
                        const bindings = blockScope.getBinding('parent');
                        for (const ref of (bindings.referencePaths: Array)) {
                            ref.replaceWithJS(
                                t.memberExpression(
                                    t.identifier(embedName),
                                    t.identifier(blockName)
                                )
                            );
                        }
                    }
                }
            }
            let context = t.identifier(path.scope.contextName);
            if (path.node.argument) {
                if (path.node.contextFree) {
                    context = t.callExpression(
                        t.identifier(
                            this.addImportFrom(
                                'melody-runtime',
                                'createSubContext'
                            )
                        ),
                        [context, path.node.argument]
                    );
                } else {
                    context = t.callExpression(
                        t.identifier(
                            this.addImportFrom(
                                'melody-runtime',
                                'createSubContext'
                            )
                        ),
                        [context, path.node.argument]
                    );
                }
            }

            const callExpression = t.callExpression(
                t.memberExpression(
                    t.identifier(embeddedName),
                    t.identifier('render')
                ),
                [context]
            );

            path.replaceWith(new Fragment(callExpression));
        },
    },
};

function toBlockName(name) {
    return 'render' + name[0].toUpperCase() + name.substring(1);
}
