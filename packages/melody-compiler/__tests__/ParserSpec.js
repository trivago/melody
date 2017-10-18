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
import {
    CharStream,
    Parser,
    Types,
    TokenStream,
    Lexer,
    LEFT,
    parse,
} from 'melody-parser';
import * as n from 'melody-types';

describe('Parser', function() {
    describe('when parsing expressions', function() {
        it('should match an identifier', function() {
            const node = parse`{{ hello }}`;
            expect(node.expressions.length).toBe(1);
            expect(node).toMatchSnapshot();
        });

        it('should match null, true and false literals', function() {
            const node = parse`{{ a | default(null) ? false : true }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match numeric subscript expressions', function() {
            const node = parse`{{ foo.2 }}`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing array expressions', function() {
        it('should match an array access', function() {
            const node = parse`{{ hello{# just a comment that should be ignored #}[test] }}`;
            expect(node.toJSON()).toMatchSnapshot();
        });

        it('should match an indexed array access', function() {
            const node = parse`{{ hello[0] }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a string array access', function() {
            const node = parse`{{ hello["hello"] }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a complex array access', function() {
            const node = parse`{{ hello[foo.bar(2)] }}`;
            expect(node).toMatchSnapshot();
        });

        it('should allow trailing commas', function() {
            var node = parse`{{ [a, b,] }}`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing map expressions', function() {
        it('should parse map expressions', function() {
            var node = parse`{{ {
            a: "foo",
            "b#{ar}": "bar",
            2: 4,
            (a): foo,
            } }}`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing function call expressions', function() {
        it('should match a function call', function() {
            const node = parse`{{ hello() }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a function call with a map expression argument', function() {
            const node = parse`{{ hello({ test: "bar", foo: test}, [1, 2, 3, test]) }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a function call with named arguments', function() {
            const node = parse`{{ hello(first = foo) }}`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing slice expressions', function() {
        it('should match a pre-slice expression', function() {
            const node = parse`{{ foo[:2] }}`;

            expect(node).toMatchSnapshot();
        });

        it('should match a post-slice expression', function() {
            const node = parse`{{ foo[2:] }}`;

            expect(node).toMatchSnapshot();
        });

        it('should match a full-slice expression', function() {
            const node = parse`{{ foo[3:5] }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a slice expression on a member', function() {
            const node = parse`{{ foo.bar[3:5] }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a slice expression with an expression range', function() {
            const node = parse('{{ hello[range.start:range[end]] }}');
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing filter expressions', function() {
        it('should match a simple filter', function() {
            const node = parse`{{ test | foo }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a filter with arguments', function() {
            const node = parse`{{ foo | slice(1,3) }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match multiple filters', function() {
            const node = parse`{{ foo | slice(1,3) | raw }}`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing conditional expressions', function() {
        it('should match a simple conditional', function() {
            const node = parse`{{ test ? foo : bar }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a simple conditional with empty alternate', function() {
            const node = parse`{{ test ? foo : '' }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match an if-then expression', function() {
            const node = parse`{{ test ? foo }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match an if-otherwise expression', function() {
            const node = parse`{{ test ?: bar }}`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing strings', function() {
        it('should match a string', function() {
            const node = parse`{{ "foo" }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match an interpolated string', function() {
            const node = parse`{{ "foo #{bar}" }}`;
            expect(node).toMatchSnapshot();
        });

        it('should match a complex string concat', function() {
            const node = parse`{{ " foo #{bar} " }}`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing operators', function() {
        it('should match unary operators', function() {
            const l = getLexer('{{ not foo }}');
            l.addOperators('not');
            const p = getParser(l);
            p.addUnaryOperator({
                text: 'not',
                precendence: 500,
                createNode(token, expr) {
                    return new n.UnaryExpression(token.text, expr);
                },
            });
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should match binary operators', function() {
            const l = getLexer('{{ foo in bar}}');
            l.addOperators('not', 'in');
            const p = getParser(l);
            p.addUnaryOperator({
                text: 'not',
                precedence: 500,
                createNode(token, expr) {
                    return new n.UnaryExpression(token.text, expr);
                },
            });
            p.addBinaryOperator({
                text: 'in',
                precedence: 400,
                associativity: LEFT,
                createNode(token, lhs, rhs) {
                    return new n.BinaryExpression(token.text, lhs, rhs);
                },
            });
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should match mixed operators', function() {
            const l = getLexer('{{ not foo in bar}}');
            l.addOperators('not', 'in');
            const p = getParser(l);
            p.addUnaryOperator({
                text: 'not',
                precedence: 200,
                createNode(token, expr) {
                    return new n.UnaryExpression(token.text, expr);
                },
            });
            p.addBinaryOperator({
                text: 'in',
                precedence: 400,
                associativity: LEFT,
                createNode(token, lhs, rhs) {
                    return new n.BinaryExpression(token.text, lhs, rhs);
                },
            });
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should match self-parsing binary operators', function() {
            const l = getLexer('{{ foo is not defined}}');
            l.addOperators('not', 'is');
            const p = getParser(l);
            p.addUnaryOperator({
                text: 'not',
                precedence: 200,
                createNode(token, expr) {
                    return new n.UnaryExpression(token.text, expr);
                },
            });
            p.addBinaryOperator({
                text: 'is',
                precedence: 400,
                associativity: LEFT,
                parse(parser, token, expr) {
                    let tokens = parser.tokens,
                        not,
                        test;
                    if (tokens.test(Types.OPERATOR, 'not')) {
                        not = tokens.next();
                    }
                    test = tokens.expect(Types.SYMBOL);
                    expr = new n.BinaryExpression(
                        token.text,
                        expr,
                        new n.Identifier(test.text),
                    );
                    if (not) {
                        expr = new n.UnaryExpression('not', expr);
                    }
                    return expr;
                },
            });
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing tags', function() {
        it('should match tags', function() {
            const p = getParser(
                getLexer(
                    '{% if foo %}hello {{ adjective }} world{% else %}hello universe{% endif %}',
                ),
            );
            p.addTag({
                name: 'if',
                parse(parser, token) {
                    let tokens = parser.tokens,
                        test = parser.matchExpression(),
                        consequent,
                        alternate;
                    tokens.expect(Types.TAG_END);
                    consequent = parser.parse(function(tagName) {
                        return tagName === 'endif' || tagName === 'else';
                    });
                    if (tokens.nextIf(Types.SYMBOL, 'endif')) {
                        tokens.expect(Types.TAG_END);
                        alternate = null;
                    } else if (tokens.nextIf(Types.SYMBOL, 'else')) {
                        tokens.expect(Types.TAG_END);
                        alternate = parser.parse(function(tagName) {
                            return tagName === 'endif';
                        });
                        tokens.expect(Types.SYMBOL, 'endif');
                        tokens.expect(Types.TAG_END);
                    }
                    return new n.ConditionalExpression(
                        test,
                        consequent,
                        alternate,
                    );
                },
            });
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should fail on unknown tags', function() {
            expect(function() {
                parse`{% unknown_tag %}`;
            }).toThrowErrorMatchingSnapshot();
        });
    });

    describe('when parsing HTML', function() {
        it('should match a simple element', function() {
            const node = parse`<div>test</div>`;
            expect(node).toMatchSnapshot();
        });

        it('should match an element with an expression attribute', function() {
            const node = parse`<div id="{{id}}">test</div>`;
            expect(node).toMatchSnapshot();
        });

        it('should match an element with attributes', function() {
            const node = parse`<div class="foo {{bar}}" id="{{id}}">test</div>`;
            expect(node).toMatchSnapshot();
        });

        it('should fail when parsing an incomplete element', function() {
            expect(function() {
                parse`<div class="foo {{bar}}" id="{{id}}"`;
            }).toThrowErrorMatchingSnapshot();
        });

        it('should fail when parsing an opening expression attribute', function() {
            expect(function() {
                parse`<div {{`;
            }).toThrowErrorMatchingSnapshot();
        });

        it('should match nested elements with attributes', function() {
            const node = parse`<div class="foo {{bar}}" id="{{id}}"><div>hello</div> world</div>`;
            expect(node).toMatchSnapshot();
        });

        it('should match self-closing tags', function() {
            const node = parse`<img>`;
            expect(node).toMatchSnapshot();
        });

        it('should match self-closing tags with /', function() {
            const node = parse`<img />`;
            expect(node).toMatchSnapshot();
        });

        it('should match expression arguments', function() {
            const node = parse`<img {{ attributes }}>`;
            expect(node).toMatchSnapshot();
        });

        it('should match standalone attributes', function() {
            const node = parse`<input type="checkbox" checked>`;
            expect(node).toMatchSnapshot();
        });
    });
});

function getParser(lexer) {
    return new Parser(new TokenStream(lexer));
}

function getLexer(code) {
    return new Lexer(new CharStream(code));
}
