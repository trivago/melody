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
import { is } from 'melody-types';
import { prepareNode, assembleNode } from '../helpers/index.js';

function toJSXMemberExpression(memberExpression) {
    const { object, property } = memberExpression;
    return t.jSXMemberExpression(
        is(object, 'MemberExpression')
            ? toJSXMemberExpression(object)
            : t.jSXIdentifier(object.name),
        t.jSXIdentifier(property.name)
    );
}

export default {
    convert: {
        MountStatement: {
            enter(path) {
                prepareNode(path);
            },
            exit(path) {
                let componentName;
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
                            // JSX expects component names to be capitalized, otherwise
                            // it assumes it's an html element
                            this.generateComponentUid(source)
                        );
                    }
                    path.scope.registerBinding(localName, path, 'var');
                    this.markIdentifier(localName);
                    componentName = t.identifier(localName);
                } else {
                    componentName = path.node.name;
                }

                const replacements = [];

                const attributes = path.node.argument;
                let properties = [];
                if (attributes) {
                    if (is(attributes, 'ObjectExpression')) {
                        properties = attributes.properties.map(
                            ({ key, value }) => {
                                return t.jSXAttribute(
                                    t.jSXIdentifier(
                                        is(key, 'Identifier')
                                            ? key.name
                                            : key.value
                                    ),
                                    t.jSXExpressionContainer(value)
                                );
                            }
                        );
                    } else {
                        properties = [t.jSXSpreadAttribute(attributes)];
                    }
                }

                if (path.node.key) {
                    properties.push(
                        t.jSXAttribute(
                            t.jSXIdentifier('key'),
                            t.jSXExpressionContainer(path.node.key)
                        )
                    );
                }

                let identifier = componentName;
                if (is(identifier, 'MemberExpression')) {
                    identifier = toJSXMemberExpression(identifier);
                } else {
                    identifier = t.jSXIdentifier(identifier.name);
                }

                const jsxElement = t.jSXElement(
                    t.jSXOpeningElement(identifier, properties, true),
                    null,
                    [],
                    true
                );

                replacements.push(assembleNode(path, jsxElement));

                path.replaceWithMultipleJS(...replacements);
            },
        },
    },
};
