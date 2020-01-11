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

function parentIsForStatement(path) {
    const { parentPath } = path;

    if (!parentPath) {
        return false;
    }

    if (parentPath.is('ForStatement')) {
        return true;
    }

    if (parentPath.is('Element')) {
        return false;
    }

    return parentIsForStatement(parentPath);
}

export default {
    analyse: {
        MountStatement: {
            enter(path) {
                if (path.node.errorVariableName) {
                    path.get('otherwise').scope.registerBinding(
                        path.node.errorVariableName.name,
                        path.get('errorVariableName'),
                        'var'
                    );
                }
            },
        },
    },
    convert: {
        MountStatement: {
            exit(path) {
                const args = [];
                const isAsync = path.node.async;
                if (isAsync) {
                    const localName = this.addImportFrom(
                        'melody-runtime',
                        'AsyncComponent'
                    );
                    args.push(t.identifier(localName));
                } else if (path.node.source) {
                    const source = path.node.source.value;
                    let localName;
                    if (path.node.name) {
                        localName = this.addImportFrom(
                            source,
                            path.node.name.name
                        );
                    } else {
                        localName = this.addDefaultImportFrom(
                            source,
                            this.generateComponentUid(source)
                        );
                    }
                    path.scope.registerBinding(localName, path, 'var');
                    this.markIdentifier(localName);
                    args.push(t.identifier(localName));
                } else {
                    args.push(path.node.name);
                }

                if (path.node.key === null) {
                    const message = 'mount is missing a key.';
                    const advice =
                        "When mounting a component please make sure to always specify a key, i.e. `{% mount './component' as 'comp' %}";
                    const location = path.node.tagNameLoc;
                    path.state.warn(message, location, advice, 5);
                }
                if (path.node.key) {
                    if (path.get('key').is('StringLiteral')) {
                        args.push(path.node.key);
                    } else {
                        args.push(
                            t.binaryExpression(
                                '+',
                                t.stringLiteral(''),
                                path.node.key
                            )
                        );
                    }
                } else if (
                    !parentIsForStatement(path) &&
                    this.options.generateKey
                ) {
                    args.push(t.stringLiteral(this.generateKey()));
                } else {
                    args.push(t.nullLiteral());
                }

                if (isAsync) {
                    const source = path.node.source;

                    source.leadingComments = [
                        {
                            type: 'CommentBlock',
                            value: ` ${[
                                path.get('key').is('StringLiteral')
                                    ? `webpackChunkName: "${
                                          args[args.length - 1].value
                                      }"`
                                    : '',
                            ]
                                .filter(Boolean)
                                .join(', ')} `,
                        },
                    ];
                    const argument = [
                        t.objectProperty(
                            t.identifier('promisedComponent'),
                            t.arrowFunctionExpression(
                                [],
                                t.callExpression(t.identifier('import'), [
                                    source,
                                ])
                            )
                        ),
                        t.objectProperty(
                            t.identifier('delayLoadingAnimation'),
                            t.numericLiteral(path.node.delayBy)
                        ),
                    ];
                    if (path.node.body.body.length === 0) {
                        // message, pos, advice, length = 1
                        this.error(
                            `Asynchronously mounted components must have a placeholder`,
                            path.node.tagNameLoc,
                            `When using an async component you must provide a placeholder that can be rendered while your component is being loaded.
Example:
{% mount async 'my-component' as 'mycomp' %}
This is the placeholder content that will be shown to your users while the async component is being loaded.`,
                            path.node.tagNameLoc.line === path.node.loc.end.line
                                ? path.node.loc.end.column -
                                      path.node.tagNameLoc.column
                                : 'mount async'.length
                        );
                    }
                    argument.push(
                        t.objectProperty(
                            t.identifier('whileLoading'),
                            t.arrowFunctionExpression([], path.node.body)
                        )
                    );
                    if (path.node.otherwise) {
                        argument.push(
                            t.objectProperty(
                                t.identifier('onError'),
                                t.arrowFunctionExpression(
                                    [path.node.errorVariableName],
                                    path.node.otherwise
                                )
                            )
                        );
                    }
                    if (path.node.argument) {
                        argument.push(
                            t.objectProperty(
                                t.identifier('data'),
                                path.node.argument
                            )
                        );
                    }
                    args.push(t.objectExpression(argument));
                } else {
                    if (path.node.argument) {
                        args.push(path.node.argument);
                    }
                }

                path.replaceWithJS(
                    t.expressionStatement(
                        t.callExpression(
                            t.identifier(
                                path.state.addImportFrom(
                                    'melody-idom',
                                    'component'
                                )
                            ),
                            args
                        )
                    )
                );
            },
        },
    },
};
