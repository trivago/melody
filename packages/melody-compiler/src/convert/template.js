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
import { camelCase } from 'lodash';

// Not using lodash capitalize here, because it makes the rest of the string lowercase
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDisplayName(str) {
    return capitalize(camelCase(str));
}

function buildRenderFunction(ctx) {
    return t.expressionStatement(
        t.assignmentExpression(
            '=',
            t.memberExpression(ctx.TEMPLATE, ctx.NAME),
            t.functionExpression(
                null,
                [t.identifier('_context')],
                t.blockStatement(ctx.BODY)
            )
        )
    );
}

export default {
    Identifier: {
        exit(path) {
            if (!this.isReferenceIdentifier(path)) {
                return;
            }
            let binding = path.scope.getBinding(path.node.name),
                contextName;
            if (binding) {
                const originalName = binding.getData('Identifier.OriginalName');
                if (originalName) {
                    path.node.name = originalName;
                }
                if (binding.getData('ImportDeclaration.ImportFromSelf')) {
                    path.parentPath.replaceWith(path.parent.property);
                } else if (binding.kind === 'context') {
                    contextName =
                        path.getData('Identifier.contextName') ||
                        binding.scope.contextName ||
                        path.scope.contextName;
                } else if (
                    binding.kind === 'var' &&
                    binding.scope.escapesContext &&
                    binding.contextual
                ) {
                    if (binding.shadowedBinding) {
                        binding = binding.getRootDefinition();
                    }
                    contextName =
                        path.getData('Identifier.contextName') ||
                        binding.scope.contextName ||
                        path.scope.contextName;
                }
            }
            if (contextName) {
                const replacement = t.memberExpression(
                    t.identifier(contextName),
                    t.identifier(path.node.name)
                );
                path.replaceWithJS(replacement);
            }
        },
    },
    PrintStatement: {
        enter(path) {
            // remove empty print statements
            // todo should we really do this?
            const value = path.get('value');
            if (value.is('StringLiteral')) {
                // if(value.node.value.trim() === '') {
                if (value.node.value.match(/^\s*$/)) {
                    path.remove();
                    return;
                } else if (
                    this.isInSpaceless() &&
                    Array.isArray(path.container) &&
                    Number.isInteger(path.key)
                ) {
                    if (path.key === 0) {
                        value.node.value = value.node.value.replace(/^\s+/, '');
                    }
                    if (path.key === path.container.length - 1) {
                        value.node.value = value.node.value.replace(/\s+$/, '');
                    }
                }
                value.node.value = value.node.value.replace(
                    /^\s{2,}|\s{2,}$/g,
                    ' '
                );
            }
        },
    },
    SpacelessBlock: {
        enter() {
            this.enterSpaceless();
        },
        exit(path) {
            this.exitSpaceless();
            path.replaceWithMultipleJS(...path.node.body);
        },
    },
    RootScope: {
        enter(path) {
            // handle "import _self as t;"
            const scope = path.scope.getRootScope();
            let localMacroImportUsages;
            for (const identifier of Object.keys(
                path.scope.getRootScope().bindings
            )) {
                const binding = scope.getBinding(identifier);
                if (
                    binding &&
                    binding.kind === 'macro' &&
                    binding.getData('ImportDeclaration.ImportFromSelf')
                ) {
                    localMacroImportUsages = binding;
                    break;
                }
            }
            if (localMacroImportUsages && localMacroImportUsages.referenced) {
                for (const usage of (localMacroImportUsages.referencePaths: Array)) {
                    if (usage.parentPath.is('MemberExpression')) {
                        usage.parentPath.replaceWith(usage.parent.property);
                    }
                }
            }
        },
        exit(path) {
            if (path.scope.mutated && path.scope.escapesContext) {
                path.node.body.unshift(
                    t.variableDeclaration('const', [
                        t.variableDeclarator(
                            t.identifier(path.scope.contextName),
                            t.callExpression(
                                t.identifier(
                                    this.addImportFrom(
                                        'melody-runtime',
                                        'createSubContext'
                                    )
                                ),
                                [t.identifier('_context')]
                            )
                        ),
                    ])
                );
            }
        },
    },
    Scope: {
        exit(path) {
            insertVariableDeclarations(path);
        },
    },
    Template: {
        enter(path) {
            // create general structure of template
            this.templateVariableName = '_template';
            path.scope.registerBinding(this.templateVariableName);
            let fileName = this.file.fileName || '<unknown>';

            const fileParts = fileName.split('/');
            const name = fileParts.pop().split('.')[0];

            if (name === 'index' || name === 'base') {
                fileName = getDisplayName(fileParts.pop());
            } else {
                fileName = getDisplayName(name);
            }
            this.fileName = this.generateUid(fileName);
            this.markIdentifier(this.fileName);

            if (path.node.parentName) {
                this.parentName = path.scope.generateUid('parent');
                path.scope.registerBinding(this.parentName);
                this.program.body.splice(
                    0,
                    0,
                    t.exportNamedDeclaration(
                        t.variableDeclaration('const', [
                            t.variableDeclarator(
                                t.identifier(this.templateVariableName),
                                t.callExpression(
                                    t.memberExpression(
                                        t.identifier('Object'),
                                        t.identifier('create')
                                    ),
                                    [t.identifier(this.parentName)]
                                )
                            ),
                        ]),
                        []
                    )
                );
                if (path.node.body.length) {
                    path.node.body.push(
                        new Fragment(
                            t.callExpression(
                                t.memberExpression(
                                    t.memberExpression(
                                        t.identifier(this.parentName),
                                        t.identifier('render')
                                    ),
                                    t.identifier('call')
                                ),
                                [
                                    t.identifier(this.templateVariableName),
                                    t.identifier(path.scope.contextName),
                                ]
                            )
                        )
                    );
                }
            } else {
                this.program.body.splice(
                    0,
                    0,
                    t.exportNamedDeclaration(
                        t.variableDeclaration('const', [
                            t.variableDeclarator(
                                t.identifier(this.templateVariableName),
                                t.objectExpression([])
                            ),
                        ]),
                        []
                    )
                );
            }
            path.replaceWith(path.node);
        },
        exit(path) {
            if (path.scope.mutated && path.scope.escapesContext) {
                path.node.body.unshift(
                    t.variableDeclaration('const', [
                        t.variableDeclarator(
                            t.identifier(path.scope.contextName),
                            t.callExpression(
                                t.identifier(
                                    this.addImportFrom(
                                        'melody-runtime',
                                        'createSubContext'
                                    )
                                ),
                                [t.identifier('_context')]
                            )
                        ),
                    ])
                );
            }
            insertVariableDeclarations(path);
            const fileName = this.fileName;

            if (!path.node.parentName) {
                this.program.body.push(
                    buildRenderFunction({
                        TEMPLATE: t.identifier(this.templateVariableName),
                        NAME: t.identifier('render'),
                        BODY: path.node.body,
                    })
                );
            } else {
                const parentName = this.parentName;
                const importDecl = t.importDeclaration(
                    [
                        t.importSpecifier(
                            t.identifier(parentName),
                            t.identifier('_template')
                        ),
                    ],
                    path.node.parentName
                );
                this.program.body.splice(0, 0, importDecl);
                const body = path.get('body').map(e => e.node);
                if (body.length) {
                    const renderFunction = buildRenderFunction({
                        TEMPLATE: t.identifier(this.templateVariableName),
                        NAME: t.identifier('render'),
                        BODY: body,
                    });
                    this.program.body.push(renderFunction);
                }
            }
            this.program.body.push(
                t.ifStatement(
                    t.binaryExpression(
                        '!==',
                        t.memberExpression(
                            t.memberExpression(
                                t.identifier('process'),
                                t.identifier('env')
                            ),
                            t.identifier('NODE_ENV')
                        ),
                        t.stringLiteral('production')
                    ),
                    t.blockStatement([
                        t.expressionStatement(
                            t.assignmentExpression(
                                '=',
                                t.memberExpression(
                                    t.identifier(this.templateVariableName),
                                    t.identifier('displayName')
                                ),
                                t.stringLiteral(fileName)
                            )
                        ),
                    ])
                )
            );
            this.program.body.push(
                t.exportDefaultDeclaration(
                    t.functionDeclaration(
                        t.identifier(fileName),
                        [t.identifier('props')],
                        t.blockStatement([
                            t.returnStatement(
                                t.callExpression(
                                    t.memberExpression(
                                        t.identifier(this.templateVariableName),
                                        t.identifier('render')
                                    ),
                                    [t.identifier('props')]
                                )
                            ),
                        ])
                    )
                    //t.identifier(this.templateVariableName),
                )
            );
            path.replaceWithJS(this.program);
        },
    },
};

function insertVariableDeclarations(path) {
    const bindings = path.scope.bindings,
        varDeclarations = [];
    for (const name in bindings) {
        const binding = bindings[name];
        if (
            binding &&
            binding.contextual &&
            !binding.scope.escapesContext &&
            !binding.shadowedBinding
        ) {
            varDeclarations.push(t.variableDeclarator(t.identifier(name)));
        }
    }
    if (varDeclarations.length) {
        let body = path.node.body;
        if (body && body.body) {
            body = body.body;
        }
        if (!body) {
            body = path.node.expressions;
        }
        if (!body) {
            body = [];
        }
        //const body = (path.node.body && path.node.body.body) || path.node.expressions || [];
        body.unshift(t.variableDeclaration('let', varDeclarations));
    }
}
