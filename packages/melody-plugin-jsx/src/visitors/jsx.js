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
import * as t from '@babel/types';
import { is } from 'melody-types';
import {
    prepareNode,
    assembleNode,
    isMutated,
    isSaveAttribute,
    getJSXAttributeName,
    getJSXAttributeValue,
} from '../helpers/index.js';

export default {
    analyse: {
        Statement: {
            exit(path) {
                const { node } = path;
                if (
                    is(node, 'PrintExpressionStatement') ||
                    is(node, 'PrintTextStatement') ||
                    is(node, 'IncludeStatement') ||
                    is(node, 'BlockStatement') ||
                    is(node, 'EmbedStatement') ||
                    is(node, 'MountStatement')
                ) {
                    return;
                }
                const parentElement = path.findParentPathOfType('Element');
                if (parentElement && !is(path.parent, 'BlockStatement')) {
                    parentElement.setData('containsStatements', true);
                }
            },
        },
        Element: {
            exit(path) {
                const containsStatements = path.getData('containsStatements');
                if (containsStatements) {
                    const parentElement = path.findParentPathOfType('Element');
                    if (parentElement && !is(path.parent, 'BlockStatement')) {
                        parentElement.setData('containsStatements', true);
                    }
                }
            },
        },
    },
    convert: {
        PrintStatement: {
            enter(path) {
                prepareNode(path);
            },
            exit(path) {
                const { node } = path;

                let jsxElement;
                const { value } = node;
                if (is(value, 'ExpressionStatement')) {
                    jsxElement = value.expression;
                } else {
                    jsxElement = value;
                }

                path.replaceWithJS(assembleNode(path, jsxElement));
            },
        },
        Element: {
            enter(path) {
                prepareNode(path);
            },
            exit(path) {
                const { node } = path;
                const { attributes } = node;
                const replacements = [];

                const saveAttributes = [];
                const unsaveAttributes = [];

                const isSelfClosing = node.selfClosing || !node.children.length;
                const containsStatements = path.getData('containsStatements');

                function classifyAttribute(node) {
                    if (!containsStatements) {
                        saveAttributes.push(node);
                        return;
                    }
                    const save = is(node, 'Identifier')
                        ? !isMutated(path, node)
                        : isSaveAttribute(node);
                    if (save) {
                        saveAttributes.push(node);
                    } else {
                        unsaveAttributes.push(node);
                    }
                }

                if (attributes.length) {
                    attributes.forEach(node => {
                        if (is(node, 'StringLiteral')) {
                            saveAttributes.push(node);
                        } else if (is(node, 'ObjectExpression')) {
                            const { properties = [] } = node;
                            properties.forEach(prop => classifyAttribute(prop));
                        } else {
                            classifyAttribute(node);
                        }
                    });
                }

                const unsaveAttributeNames = unsaveAttributes.map(() => {
                    const name = path.scope.generateUid('prop');
                    path.scope.registerBinding(name, path, 'let');
                    return name;
                });

                const declarations = unsaveAttributes.map((attribute, idx) => {
                    const name = unsaveAttributeNames[idx];
                    const value = is(attribute, 'Identifier')
                        ? attribute
                        : attribute.value;
                    return t.variableDeclarator(t.identifier(name), value);
                });

                const childNames = path.getData('childNames');
                const childNamesArrays = path.getData('childNamesArrays');
                if (containsStatements) {
                    if (childNames.length) {
                        childNames.forEach((childName, idx) => {
                            const isArray = childNamesArrays[idx];
                            declarations.push(
                                t.variableDeclarator(
                                    t.identifier(childName),
                                    isArray
                                        ? t.newExpression(
                                              t.identifier('Array'),
                                              []
                                          )
                                        : undefined
                                )
                            );
                        });
                    }
                    if (declarations.length) {
                        replacements.push(
                            t.variableDeclaration('let', declarations)
                        );
                    }

                    // push AST children, here the actual children will be generated
                    replacements.push(...node.children);
                }

                const properties = [];

                saveAttributes.forEach(node => {
                    if (is(node, 'StringLiteral')) {
                        properties.push(
                            t.jSXAttribute(getJSXAttributeName(node), null)
                        );
                    } else if (is(node, 'Attribute')) {
                        properties.push(
                            t.jSXAttribute(
                                getJSXAttributeName(node.name),
                                getJSXAttributeValue(node.value)
                            )
                        );
                    } else if (is(node, 'ObjectProperty')) {
                        properties.push(
                            t.jSXAttribute(
                                getJSXAttributeName(node.key),
                                getJSXAttributeValue(node.value)
                            )
                        );
                    } else {
                        properties.push(t.jSXSpreadAttribute(node));
                    }
                });

                unsaveAttributes.forEach((node, idx) => {
                    const identifierName = unsaveAttributeNames[idx];
                    const identifier = t.identifier(identifierName);
                    if (is(node, 'Attribute')) {
                        properties.push(
                            t.jSXAttribute(
                                getJSXAttributeName(node.name),
                                t.JSXExpressionContainer(identifier)
                            )
                        );
                    } else if (is(node, 'ObjectProperty')) {
                        properties.push(
                            t.jSXAttribute(
                                getJSXAttributeName(node.key),
                                t.JSXExpressionContainer(identifier)
                            )
                        );
                    } else {
                        properties.push(t.jSXSpreadAttribute(identifier));
                    }
                });

                let jsxElement;
                if (isSelfClosing) {
                    jsxElement = t.jSXElement(
                        t.jSXOpeningElement(
                            t.JSXIdentifier(node.name),
                            properties,
                            true
                        ),
                        null,
                        [],
                        true
                    );
                } else {
                    jsxElement = t.jSXElement(
                        t.jSXOpeningElement(
                            t.JSXIdentifier(node.name),
                            properties
                        ),
                        t.jSXClosingElement(t.JSXIdentifier(node.name)),
                        containsStatements
                            ? childNames.map(n =>
                                  t.jSXExpressionContainer(t.identifier(n))
                              )
                            : node.children
                    );
                }

                replacements.push(assembleNode(path, jsxElement));

                path.replaceWithMultipleJS(...replacements);
            },
        },
        Fragment: {
            enter(path) {
                prepareNode(path);
            },
            exit(path) {
                path.replaceWithJS(assembleNode(path, path.node.value));
            },
        },
    },
};
