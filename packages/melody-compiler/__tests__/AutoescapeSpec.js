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
import chai from 'chai';
import chaiSubset from 'chai-subset';
import { expect } from 'chai';
import { CharStream, Parser, TokenStream, Lexer } from 'melody-parser';
import { extension } from 'melody-extension-core';

chai.use(chaiSubset);

describe('autoescape', function() {
    describe('when parsing', function() {
        it('should be parsed', function() {
            const node = parse(
                `{% autoescape 'html' %}
Everything will be automatically escaped in this block using the {{ strategy }} strategy.
{% endautoescape %}`,
            );
            expect(node.expressions[0]).to.containSubset({
                type: 'AutoescapeBlock',
                escapeType: 'html',
                expressions: [
                    {
                        type: 'PrintTextStatement',
                        value: {
                            type: 'StringLiteral',
                            value:
                                '\nEverything will be automatically escaped in this block using the ',
                        },
                    },
                    {
                        type: 'PrintExpressionStatement',
                        value: {
                            type: 'Identifier',
                            name: 'strategy',
                        },
                    },
                    {
                        type: 'PrintTextStatement',
                        value: {
                            type: 'StringLiteral',
                            value: ' strategy.\n',
                        },
                    },
                ],
            });
        });
    });
});

//describe('if', function() {
//    it('parses correctly', function() {
//        const node = parse(
//            `{% if foo %}a{% elseif bar %}b{%elseif baz %}c{%else%}d{% endif %}`
//        );
//        expect(node.expressions[0].toJSON()).to.containSubset({
//            type: 'IfStatement',
//            test: {
//                type: 'Identifier',
//                name: 'foo'
//            },
//            consequent: {
//                type: 'SequenceExpression',
//                expressions: [{
//                    type: 'PrintTextStatement',
//                    value: {
//                        type: 'StringLiteral',
//                        value: 'a'
//                    }
//                }]
//            },
//            alternate: {
//                type: 'IfStatement',
//                test: {
//                    type: 'Identifier',
//                    name: 'bar'
//                },
//                consequent: {
//                    type: 'SequenceExpression',
//                    expressions: [{
//                        type: 'PrintTextStatement',
//                        value: {
//                            type: 'StringLiteral',
//                            value: 'b'
//                        }
//                    }]
//                },
//                alternate: {
//                    type: 'IfStatement',
//                    test: {
//                        type: 'Identifier',
//                        name: 'baz'
//                    },
//                    consequent: {
//                        type: 'SequenceExpression',
//                        expressions: [{
//                            type: 'PrintTextStatement',
//                            value: {
//                                type: 'StringLiteral',
//                                value: 'c'
//                            }
//                        }]
//                    },
//                    alternate: {
//                        type: 'SequenceExpression',
//                        expressions: [{
//                            type: 'PrintTextStatement',
//                            value: {
//                                type: 'StringLiteral',
//                                value: 'd'
//                            }
//                        }]
//                    }
//                }
//            }
//        });
//    });
//});

function parse(code) {
    let p = getParser(getLexer(code));
    for (let parser of (extension.tags: Array)) {
        p.addTag(parser);
    }
    for (let op of (extension.unaryOperators: Array)) {
        p.addUnaryOperator(op);
    }
    for (let op of (extension.binaryOperators: Array)) {
        p.addBinaryOperator(op);
    }
    for (let test of (extension.tests: Array)) {
        p.addTest(test);
    }
    return p.parse();
}

function getParser(lexer) {
    return new Parser(new TokenStream(lexer));
}

function getLexer(code) {
    return new Lexer(new CharStream(code));
}
