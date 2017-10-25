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
export default {
    Template: {
        enter(path) {
            if (!path.node.parentName) {
                const contextName = path.scope.generateUid('context');
                path.scope.registerBinding(contextName, path, 'param');
                path.scope.contextName = contextName;
            }
        },
        exit(path) {
            if (path.node.parentName) {
                const body = path.get('body');
                for (let i = 0, len = body.length; i < len; i++) {
                    const stmt = body[i];
                    if (
                        !stmt.is('ContextMutation') &&
                        !stmt.is('BlockStatement')
                    ) {
                        stmt.remove();
                    }
                }
            }
        },
    },
    Identifier(path) {
        if (this.isReferenceIdentifier(path)) {
            path.scope.reference(path.node.name, path);
        } else if (
            path.parentPath.is('MacroDeclarationStatement') &&
            path.parentKey == 'arguments'
        ) {
            path.scope.registerBinding(path.node.name, path, 'param');
        } else if (
            path.parentPath.is('CallExpression') &&
            path.parentKey === 'callee'
        ) {
            if (this.functionMap[path.node.name]) {
                path.scope.registerBinding(path.node.name, path, 'function');
            } else {
                path.scope.reference(path.node.name, path);
            }
        }
    },
    VariableDeclarationStatement(path) {
        const varName = path.node.name;
        const previousBinding = path.scope.getBinding(varName.name);
        if (previousBinding && previousBinding.kind === 'var') {
            previousBinding.definitionPaths.push(path);
            previousBinding.mutated = true;
        } else {
            path.scope.registerBinding(
                varName.name,
                path,
                'var'
            ).contextual = true;
            path.scope.mutated = true;
        }
    },
    FromStatement: {
        exit(path) {
            if (path.get('source').is('Identifier')) {
                if (path.node.source.name === '_self') {
                    path.remove();
                }
            }
        },
    },
    ImportDeclaration(path) {
        const rootScope = path.scope,
            identifier = path.node.alias || path.node.key;
        const binding = rootScope.registerBinding(
            identifier.name,
            path.node.alias ? path.get('alias') : path.get('key'),
            'macro'
        );
        if (
            path.get('key').is('Identifier') &&
            path.node.key.name !== '_self'
        ) {
            binding.setData('Identifier.OriginalName', path.node.key.name);
        }
    },
    MacroDeclarationStatement(path) {
        const scope = path.scope;
        const rootScope = scope.getRootScope();
        rootScope.registerBinding(
            path.node.name.name,
            path.get('name'),
            'macro'
        );

        scope.registerBinding('varargs', path, 'param');
    },
    Include(path) {
        if (path.node.contextFree === false) {
            path.scope.escapesContext = true;
        }
    },
    BlockStatement(path) {
        if (this.template.parentName || path.parentPath.is('EmbedStatement')) {
            path.scope.registerBinding('parent', path, 'var');
        }
        path.scope.registerBinding('_context', path, 'param');
        path.scope.contextName = '_context';
        path.parentPath.scope.escapesContext = true;
    },
    Scope: {
        exit(path) {
            if (path.scope.escapesContext) {
                if (path.scope.parent) {
                    if (!path.scope.parent.escapesContext) {
                        path.scope.parent.escapesContext = true;
                    }
                }
            }
            if (
                path.scope.mutated &&
                path.scope.escapesContext &&
                path.scope.contextName === '_context'
            ) {
                const contextName = path.scope.generateUid('context');
                path.scope.registerBinding(contextName, path, 'const');
                path.scope.contextName = contextName;
            }
        },
    },
    RootScope: {
        exit(path) {
            if (
                path.scope.mutated &&
                path.scope.escapesContext &&
                path.scope.contextName === '_context'
            ) {
                const contextName = path.scope.generateUid('context');
                path.scope.registerBinding(contextName, path, 'const');
                path.scope.contextName = contextName;
            }
        },
    },
};
