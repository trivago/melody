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
    convert: {
        MountStatement: {
            exit(path) {
                const args = [];
                if (path.node.source) {
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
                if (path.node.argument) {
                    args.push(path.node.argument);
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
