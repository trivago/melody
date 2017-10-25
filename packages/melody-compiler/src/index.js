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
import { CharStream, Lexer, TokenStream, Parser } from 'melody-parser';
import { traverse, merge, Path, Scope } from 'melody-traverse';

import { Template, File } from './Template.js';
import analyse from './analyse/index.js';
import convert from './convert/index.js';
import State from './state/State.js';
import finalizer from './finalizer/index.js';

import * as t from 'babel-types';
import generate from 'babel-generator';

// workaround for https://github.com/rollup/rollup/issues/430
import { TokenTypes } from 'melody-parser';
export { Template, File, TokenTypes };

export function compile(fileName: String, source: String, ...extensions) {
    const root = parseString(fileName, source, ...extensions);
    const template = new Template(root.expressions),
        file = new File(fileName, template),
        state = new State(file, source);
    let analyseVisitor = analyse,
        convertVisitor = convert;
    for (const ext of extensions) {
        if (ext.visitors) {
            if (Array.isArray(ext.visitors)) {
                for (const visitor of (ext.visitors: Array)) {
                    if (visitor.analyse) {
                        analyseVisitor = merge(analyseVisitor, visitor.analyse);
                    }
                    if (visitor.convert) {
                        convertVisitor = merge(convertVisitor, visitor.convert);
                    }
                }
            } else {
                if (ext.visitors.analyse) {
                    analyseVisitor = merge(
                        analyseVisitor,
                        ext.visitors.analyse
                    );
                }
                if (ext.visitors.convert) {
                    convertVisitor = merge(
                        convertVisitor,
                        ext.visitors.convert
                    );
                }
            }
        }
        if (ext.filterMap) {
            Object.assign(state.filterMap, ext.filterMap);
        }
        if (ext.functionMap) {
            Object.assign(state.functionMap, ext.functionMap);
        }
        if (ext.options) {
            Object.assign(state.options, ext.options);
        }
    }
    convertVisitor = merge(convertVisitor, finalizer);
    const scope = Scope.get(
        Path.get({
            container: file,
            key: 'template',
        })
    );
    traverse(file, analyseVisitor, scope, state);
    traverse(file, convertVisitor, scope, state);
    return t.file(file.template);
}

function parseString(fileName: string, source: string, ...extensions) {
    const lexer = new Lexer(new CharStream(source));
    for (const ext of extensions) {
        if (ext.unaryOperators) {
            lexer.addOperators(...ext.unaryOperators.map(op => op.text));
        }
        if (ext.binaryOperators) {
            lexer.addOperators(...ext.binaryOperators.map(op => op.text));
        }
    }
    const parser = new Parser(new TokenStream(lexer));
    for (const extension of extensions) {
        if (extension.tags) {
            for (const tag of (extension.tags: Array)) {
                parser.addTag(tag);
            }
        }
        if (extension.unaryOperators) {
            for (const op of (extension.unaryOperators: Array)) {
                parser.addUnaryOperator(op);
            }
        }
        if (extension.binaryOperators) {
            for (const op of (extension.binaryOperators: Array)) {
                parser.addBinaryOperator(op);
            }
        }
        if (extension.tests) {
            for (const test of (extension.tests: Array)) {
                parser.addTest(test);
            }
        }
    }

    return parser.parse();
}

export function toString(jsAst, code) {
    return generate(jsAst, null, code);
}
