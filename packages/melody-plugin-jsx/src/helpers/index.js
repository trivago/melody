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
import { traverse } from 'melody-traverse';
import propsMap from './propsMap.js';

export function mapPropName(prop) {
    const mapped = propsMap[prop];
    if (mapped) {
        return mapped;
    }
    return prop;
}

export function prepareNode(path) {
    const { node } = path;
    const parentElement = path.findParentPathOfType('Element');

    if (is(node, 'Element')) {
        const isSelfClosing = node.selfClosing || !node.children.length;
        if (!isSelfClosing) {
            path.setData('childNames', []);
            path.setData('childNamesArrays', []);
        }
    }

    if (parentElement && !is(path.parent, 'BlockStatement')) {
        let childName;
        const childNames = parentElement.getData('childNames');
        const childNamesArrays = parentElement.getData('childNamesArrays');

        const parentForStatement = findParentPathOfTypeAndBreakWhen(
            path,
            'ForStatement',
            path => path && path.is('Element')
        );

        const isRootElementOfLoop = !!parentForStatement;

        if (isRootElementOfLoop) {
            const parentForStatementChildName = parentForStatement.getData(
                'childName'
            );
            if (!parentForStatementChildName) {
                childName = parentElement.scope.generateUid('child');
                parentElement.scope.registerBinding(childName, path, 'let');
                childNames.push(childName);
                childNamesArrays.push(isRootElementOfLoop);
                parentForStatement.setData('childName', childName);
            } else {
                childName = parentForStatementChildName;
            }
        } else {
            childName = parentElement.scope.generateUid('child');
            parentElement.scope.registerBinding(childName, path, 'let');
            childNames.push(childName);
            childNamesArrays.push(isRootElementOfLoop);
        }

        path.setData('childName', childName);
        path.setData('isRootElementOfLoop', isRootElementOfLoop);
    }
}

export function assembleNode(path, expression) {
    const parentElement = path.findParentPathOfType('Element');

    if (parentElement && !is(path.parent, 'BlockStatement')) {
        const parentElementContainsStatements = parentElement.getData(
            'containsStatements'
        );

        if (!parentElementContainsStatements) {
            if (is(expression, 'StringLiteral')) {
                return t.jSXText(expression.value);
            }
            if (is(expression, 'Expression') && !t.isJSXElement(expression)) {
                return t.jSXExpressionContainer(expression);
            }
            return expression;
        }

        const childName = path.getData('childName');
        const isRootElementOfLoop = path.getData('isRootElementOfLoop');

        if (isRootElementOfLoop) {
            return t.expressionStatement(
                t.assignmentExpression(
                    '=',
                    t.memberExpression(
                        t.identifier(childName),
                        t.memberExpression(
                            t.identifier(childName),
                            t.identifier('length')
                        ),
                        true
                    ),
                    expression
                )
            );
        }
        return t.expressionStatement(
            t.assignmentExpression('=', t.identifier(childName), expression)
        );
    }

    return t.returnStatement(expression);
}

export function isMutated(path, node) {
    const binding = path.scope.getBinding(node.name);
    return binding && binding.mutated;
}

export function isSaveAttribute(attribute) {
    let mutated = false;
    traverse(attribute, {
        Identifier(path) {
            mutated = mutated || isMutated(path, path.node);
        },
    });
    return !mutated;
}

export function getJSXAttributeName(node) {
    const name = is(node, 'Identifier') ? node.name : node.value;
    return t.jSXIdentifier(mapPropName(name));
}

export function getJSXAttributeValue(node) {
    if (!node) {
        return null;
    }
    return is(node, 'StringLiteral') ? node : t.jSXExpressionContainer(node);
}

export function findParentPathOfTypeAndBreakWhen(path, type, breakWhen) {
    let current = path.parentPath;
    while (current && !current.is(type)) {
        if (breakWhen(current)) {
            return null;
        }
        current = current.parentPath;
    }
    return current && current.type === type ? current : null;
}
