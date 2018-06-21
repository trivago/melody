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
import { Node } from 'melody-types';

export default {
    convert: {
        PrintStatement: {
            exit(path) {
                const value = path.get('value');
                path.replaceWithJS(
                    value.is('ExpressionStatement')
                        ? value.node
                        : callIdomFunction(this, 'text', [value.node])
                );
            },
        },
        Element: {
            exit(path) {
                const el = path.node,
                    isSelfClosing = el.selfClosing || !el.children.length;

                if (isSelfClosing && !el.attributes.length) {
                    // empty element
                    path.replaceWithJS(
                        openElementWithoutAttributes(
                            this,
                            'elementVoid',
                            el.name
                        )
                    );
                } else {
                    const replacements = [];
                    let ref;
                    // has no attributes but has children
                    if (!el.attributes.length) {
                        replacements.push(
                            openElementWithoutAttributes(
                                this,
                                'elementOpen',
                                el.name
                            )
                        );
                    } else {
                        // has attributes
                        ref = openElementWithAttributes(
                            this,
                            path,
                            el,
                            replacements
                        );
                    }

                    if (!isSelfClosing) {
                        closeElement(this, ref, replacements, el);
                    }
                    path.replaceWithMultipleJS(...replacements);
                }
            },
        },
        Fragment: {
            exit(path) {
                path.replaceWithJS(t.expressionStatement(path.node.value));
            },
        },
    },
};

function openElementWithAttributes(state, path, el, replacements) {
    const staticAttributes = [],
        attributes = [],
        dynamicAttributeExpressions = [];
    let ref;
    let key;
    let i = 0;
    for (const attrs = el.attributes, len = attrs.length; i < len; i++) {
        const attr = attrs[i];
        if (!Node.isAttribute(attr)) {
            dynamicAttributeExpressions.push(attr);
        } else if (Node.isIdentifier(attr.name) && attr.name.name === 'key') {
            key = attr.value;
        } else if (
            Node.isIdentifier(attr.name) &&
            attr.name.name === 'ref' &&
            attr.isImmutable()
        ) {
            staticAttributes.push(
                t.stringLiteral('ref'),
                t.callExpression(
                    t.identifier(state.addImportFrom('melody-idom', 'ref')),
                    [attr.value]
                )
            );
        } else if (attr.isImmutable()) {
            staticAttributes.push(t.stringLiteral(attr.name.name), attr.value);
        } else {
            addStaticAttribute(attributes, attr);
        }
    }

    key = ensureKeyIsValid(state, key, staticAttributes.length);

    const staticId = getStaticId(state, path, staticAttributes);
    const openElement = dynamicAttributeExpressions.length
        ? openDynamicAttributesElement
        : openSimpleElement;

    openElement(
        state,
        path,
        ref,
        key,
        staticId,
        attributes,
        dynamicAttributeExpressions,
        replacements
    );
    return ref;
}

function ensureKeyIsValid(state, maybeKey, hasStaticAttributes) {
    if (maybeKey) {
        return Node.isStringLiteral(maybeKey)
            ? maybeKey
            : t.binaryExpression('+', t.stringLiteral(''), maybeKey);
    }

    if (hasStaticAttributes && state.options.generateKey) {
        return t.stringLiteral(state.generateKey());
    }

    return t.nullLiteral();
}

function getStaticId(state, path, staticAttributes) {
    let staticId;
    if (staticAttributes.length) {
        const staticIdName = path.scope.generateUid('statics');
        staticId = t.identifier(staticIdName);

        path.scope.registerBinding(staticIdName, null, 'global');
        state.insertGlobalVariableDeclaration(
            'const',
            staticId,
            t.arrayExpression(staticAttributes)
        );
    } else {
        staticId = t.nullLiteral();
    }
    return staticId;
}

function openSimpleElement(
    state,
    path,
    ref,
    key,
    staticId,
    attributes,
    dynamicAttributeExpressions,
    replacements
) {
    const el = path.node;
    const isSelfClosing = el.selfClosing || !el.children.length;
    let openElementCall = elementOpen(
        state,
        isSelfClosing ? 'elementVoid' : 'elementOpen',
        el.name,
        key,
        staticId,
        attributes
    );
    if (isSelfClosing && ref) {
        openElementCall = t.callExpression(
            t.identifier(state.addImportFrom('melody-idom', 'ref')),
            [ref, openElementCall]
        );
    }
    replacements.push(t.expressionStatement(openElementCall));
}

function addStaticAttribute(attributes, attr) {
    if (Node.isIdentifier(attr.name)) {
        attributes.push(
            t.stringLiteral(attr.name.name),
            attr.value || t.booleanLiteral(true)
        );
    } else {
        attributes.push(attr.name, attr.value || t.nullLiteral());
    }
}

function openDynamicAttributesElement(
    state,
    path,
    ref,
    key,
    staticId,
    attributes,
    dynamicAttributeExpressions,
    replacements
) {
    const el = path.node;
    const isSelfClosing = el.selfClosing || !el.children.length;

    // there are dynamic attribute expressions
    replacements.push(
        t.expressionStatement(
            elementOpen(
                state,
                'elementOpenStart',
                el.name,
                key,
                staticId,
                attributes
            )
        )
    );
    // todo adjust unit tests to remove this line
    state.addImportFrom('melody-idom', 'elementOpenEnd');

    addDynamicAttributeCalls(
        state,
        path,
        dynamicAttributeExpressions,
        replacements
    );

    // close the opening tag
    replacements.push(callIdomFunction(state, 'elementOpenEnd', []));

    if (isSelfClosing) {
        if (ref) {
            replacements.push(callIdomFunction(state, 'ref', [ref]));
        }
        // insert skip to jump over any children
        replacements.push(callIdomFunction(state, 'skip', []));
        // we handle closing the tag here since there is
        // no equivalent of 'elementVoid' when using dynamic attributes
        replacements.push(
            callIdomFunction(state, 'elementClose', [t.stringLiteral(el.name)])
        );
    }
}

function addDynamicAttributeCalls(
    state,
    path,
    dynamicAttributeExpressions,
    replacements
) {
    let i = 0;
    const attrFn = t.identifier(state.addImportFrom('melody-idom', 'attr'));
    for (const len = dynamicAttributeExpressions.length; i < len; i++) {
        const scope = path.scope;
        const indexName = scope.generateUid('i');
        const localIterableName = scope.generateUid('a');
        const lengthName = scope.generateUid('len');

        scope.registerBinding(indexName, path, 'var');
        scope.registerBinding(localIterableName, path, 'var');
        scope.registerBinding(lengthName, path, 'var');

        replacements.push(
            dynamicAttributes({
                ATTR: attrFn,
                INDEX: t.identifier(indexName),
                LOCAL_ITERABLE: t.identifier(localIterableName),
                LENGTH: t.identifier(lengthName),
                ITERABLE: dynamicAttributeExpressions[i],
            })
        );
    }
}

function elementOpen(state, openType, name, key, staticId, attributes) {
    return t.callExpression(
        t.identifier(state.addImportFrom('melody-idom', openType)),
        [t.stringLiteral(name), key, staticId, ...attributes]
    );
}

function openElementWithoutAttributes(state, openType, name) {
    return callIdomFunction(state, openType, [
        t.stringLiteral(name),
        t.nullLiteral(),
        t.nullLiteral(),
    ]);
}

function callIdomFunction(state, name, args) {
    return t.expressionStatement(
        t.callExpression(
            t.identifier(state.addImportFrom('melody-idom', name)),
            args
        )
    );
}

function closeElement(state, ref, replacements, el) {
    if (ref) {
        replacements.push(callIdomFunction(state, 'ref', [ref]));
    }
    if (el.children) {
        replacements.push(...el.children);
    }
    replacements.push(
        callIdomFunction(state, 'elementClose', [t.stringLiteral(el.name)])
    );
}

function dynamicAttributes(ctx) {
    return {
        type: 'ForStatement',
        init: {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: ctx.INDEX,
                    init: {
                        type: 'NumericLiteral',
                        extra: {
                            rawValue: 0,
                            raw: '0',
                        },
                        value: 0,
                    },
                },
                {
                    type: 'VariableDeclarator',
                    id: ctx.LOCAL_ITERABLE,
                    init: {
                        type: 'ConditionalExpression',
                        test: {
                            type: 'LogicalExpression',
                            left: {
                                type: 'BinaryExpression',
                                left: {
                                    type: 'Identifier',
                                    name: 'process.env.NODE_ENV',
                                },
                                operator: '===',
                                right: {
                                    type: 'StringLiteral',
                                    extra: {
                                        rawValue: 'production',
                                        raw: '"production"',
                                    },
                                    value: 'production',
                                },
                            },
                            operator: '||',
                            right: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'Identifier',
                                        name: 'Array',
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: 'isArray',
                                    },
                                    computed: false,
                                },
                                arguments: [
                                    {
                                        type: 'UnaryExpression',
                                        operator: '',
                                        prefix: false,
                                        argument: ctx.ITERABLE,
                                    },
                                ],
                            },
                        },
                        consequent: {
                            type: 'UnaryExpression',
                            operator: '',
                            prefix: false,
                            argument: ctx.ITERABLE,
                        },
                        alternate: {
                            type: 'CallExpression',
                            callee: {
                                type: 'ArrowFunctionExpression',
                                id: null,
                                generator: false,
                                expression: false,
                                async: false,
                                params: [],
                                body: {
                                    type: 'BlockStatement',
                                    body: [
                                        {
                                            type: 'ThrowStatement',
                                            argument: {
                                                type: 'NewExpression',
                                                callee: {
                                                    type: 'Identifier',
                                                    name: 'Error',
                                                },
                                                arguments: [
                                                    {
                                                        type:
                                                            'BinaryExpression',
                                                        left: {
                                                            type:
                                                                'BinaryExpression',
                                                            left: {
                                                                type:
                                                                    'StringLiteral',
                                                                extra: {
                                                                    rawValue:
                                                                        'Dynamic attributes have to be an array, found ',
                                                                    raw:
                                                                        '"Dynamic attributes have to be an array, found "',
                                                                },
                                                                value:
                                                                    'Dynamic attributes have to be an array, found ',
                                                            },
                                                            operator: '+',
                                                            right: {
                                                                type:
                                                                    'UnaryExpression',
                                                                operator:
                                                                    'typeof',
                                                                prefix: true,
                                                                argument:
                                                                    ctx.ITERABLE,
                                                            },
                                                        },
                                                        operator: '+',
                                                        right: {
                                                            type:
                                                                'StringLiteral',
                                                            extra: {
                                                                rawValue:
                                                                    ' instead',
                                                                raw:
                                                                    '" instead"',
                                                            },
                                                            value: ' instead',
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    directives: [],
                                },
                            },
                            arguments: [],
                        },
                    },
                },
                {
                    type: 'VariableDeclarator',
                    id: ctx.LENGTH,
                    init: {
                        type: 'MemberExpression',
                        object: ctx.LOCAL_ITERABLE,
                        property: {
                            type: 'Identifier',
                            name: 'length',
                        },
                        computed: false,
                    },
                },
            ],
            kind: 'let',
        },
        test: {
            type: 'BinaryExpression',
            left: ctx.INDEX,
            operator: '<',
            right: ctx.LENGTH,
        },
        update: {
            type: 'AssignmentExpression',
            operator: '+=',
            left: ctx.INDEX,
            right: {
                type: 'NumericLiteral',
                extra: {
                    rawValue: 2,
                    raw: '2',
                },
                value: 2,
            },
        },
        body: {
            type: 'BlockStatement',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: ctx.ATTR,
                        arguments: [
                            {
                                type: 'MemberExpression',
                                object: ctx.LOCAL_ITERABLE,
                                property: ctx.INDEX,
                                computed: true,
                            },
                            {
                                type: 'MemberExpression',
                                object: ctx.LOCAL_ITERABLE,
                                property: {
                                    type: 'BinaryExpression',
                                    left: ctx.INDEX,
                                    operator: '+',
                                    right: {
                                        type: 'NumericLiteral',
                                        extra: {
                                            rawValue: 1,
                                            raw: '1',
                                        },
                                        value: 1,
                                    },
                                },
                                computed: true,
                            },
                        ],
                    },
                },
            ],
            directives: [],
        },
    };
}
