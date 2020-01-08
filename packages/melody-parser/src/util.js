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
export function setStartFromToken(node, { pos: { index, line, column } }) {
    node.loc.start = { line, column, index };
    return node;
}

export function setEndFromToken(node, { pos: { line, column }, end }) {
    node.loc.end = { line, column, index: end };
    return node;
}

export function setMarkFromToken(
    node,
    propertyName,
    { pos: { index, line, column } }
) {
    node[propertyName] = { line, column, index };
    return node;
}

export function copyStart(
    node,
    {
        loc: {
            start: { line, column, index },
        },
    }
) {
    node.loc.start.line = line;
    node.loc.start.column = column;
    node.loc.start.index = index;
    return node;
}

export function copyEnd(node, end) {
    node.loc.end.line = end.loc.end.line;
    node.loc.end.column = end.loc.end.column;
    node.loc.end.index = end.loc.end.index;
    return node;
}

export function getNodeSource(node, entireSource) {
    if (entireSource && node.loc.start && node.loc.end) {
        return entireSource.substring(node.loc.start.index, node.loc.end.index);
    }
    return '';
}

export function copyLoc(node, { loc: { start, end } }) {
    node.loc.start.line = start.line;
    node.loc.start.column = start.column;
    node.loc.start.index = start.index;
    node.loc.end.line = end.line;
    node.loc.end.column = end.column;
    node.loc.end.index = end.index;
    return node;
}

export function createNode(Type, token, ...args) {
    return setEndFromToken(setStartFromToken(new Type(...args), token), token);
}

export function startNode(Type, token, ...args) {
    return setStartFromToken(new Type(...args), token);
}

export function hasTagStartTokenTrimLeft(token) {
    return token.text.endsWith('-');
}

export function hasTagEndTokenTrimRight(token) {
    return token.text.startsWith('-');
}

export function isMelodyExtension(obj) {
    return (
        obj &&
        (Array.isArray(obj.binaryOperators) ||
            typeof obj.filterMap === 'object' ||
            typeof obj.functionMap === 'object' ||
            Array.isArray(obj.tags) ||
            Array.isArray(obj.tests) ||
            Array.isArray(obj.unaryOperators) ||
            Array.isArray(obj.visitors))
    );
}
