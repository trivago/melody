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
    getNodeSource,
} from 'melody-parser';
import { extension as coreExtensions } from 'melody-extension-core';
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

    function createParserWithOptions(code, options) {
        const lexer = new Lexer(new CharStream(code));
        return new Parser(new TokenStream(lexer, options), options);
    }

    describe('when parsing Twig comments', function() {
        it('should match a comment', function() {
            const parser = createParserWithOptions('{# This is a comment #}', {
                ignoreComments: false,
            });
            const node = parser.parse();
            expect(node).toMatchSnapshot();
        });

        it('should preserve whitespace between comments', function() {
            const parser = createParserWithOptions(
                `{# First comment #}
            
            {# Second comment #}`,
                {
                    ignoreComments: false,
                    applyWhitespaceTrimming: false,
                }
            );
            const node = parser.parse();
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

        it('should match unicode characters', function() {
            const node = parse`<em class="item__mini-icon fl-leading hide-text border-radius  icon-icn_smilie2_light ">“Good”</em>`;
            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing operators', function() {
        it('should match unary operators', function() {
            const l = getLexer('{{ not foo }}');
            l.addOperators('not');
            const p = getParser(l);
            addNotOperator(p, 500);
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should match binary operators', function() {
            const l = getLexer('{{ foo in bar}}');
            l.addOperators('not', 'in');
            const p = getParser(l);
            addNotOperator(p, 500);
            addInOperator(p);
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should match mixed operators', function() {
            const l = getLexer('{{ not foo in bar}}');
            l.addOperators('not', 'in');
            const p = getParser(l);
            addNotOperator(p, 200);
            addInOperator(p);
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should match self-parsing binary operators', function() {
            const l = getLexer('{{ foo is not defined}}');
            l.addOperators('not', 'is');
            const p = getParser(l);
            addNotOperator(p, 200);
            addIsOperator(p);
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should handle the .. operator without spaces', function() {
            const node = parse('{{ 1..5 }}', coreExtensions);
            const expression = node.expressions[0].value;
            expect(expression.type).toEqual('BinaryRangeExpression');
        });
    });

    const ifTag = {
        name: 'if',
        parse(parser, token) {
            let alternate;
            const tokens = parser.tokens;
            const test = parser.matchExpression();
            tokens.expect(Types.TAG_END);
            const consequent = parser.parse(function(tagName) {
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
            return new n.ConditionalExpression(test, consequent, alternate);
        },
    };

    describe('when parsing tags', function() {
        it('should match tags', function() {
            const p = getParser(
                getLexer(
                    '{% if foo %}hello {{ adjective }} world{% else %}hello universe{% endif %}'
                )
            );
            p.addTag(ifTag);
            const node = p.parse();
            expect(node).toMatchSnapshot();
        });

        it('should fail on unknown tags', function() {
            expect(function() {
                parse`{% unknown_tag %}`;
            }).toThrowErrorMatchingSnapshot();
        });

        it('should handle unknown tags when requested', function() {
            const node = parse('{% exit 404 %}', {
                allowUnknownTags: true,
            });

            const tagNode = node.expressions[0];
            expect(tagNode.type).toBe('GenericTwigTag');
            expect(tagNode.parts.length).toBe(1);
            expect(tagNode.parts[0].type).toBe('NumericLiteral');
            expect(tagNode.parts[0].value).toBe(404);
        });

        it('should record the correct boundaries for unknown tags', function() {
            const source = '{% exit 404 %}';
            const node = parse(source, {
                allowUnknownTags: true,
            });

            const tagNode = node.expressions[0];
            const reproducedSource = source.substr(
                tagNode.loc.start.index,
                tagNode.loc.end.index
            );
            expect(reproducedSource).toEqual(source);
        });

        it('should parse expressions in unknown tags', function() {
            const node = parse(
                '{% exit a + b %}',
                {
                    allowUnknownTags: true,
                },
                coreExtensions
            );

            const tagNode = node.expressions[0];
            expect(tagNode).toMatchSnapshot();
        });

        it('should parse an unknown "header" tag', function() {
            const node = parse(
                '{% header "Cache-Control: max-age=" ~ (expiry.timestamp - now.timestamp) %}',
                {
                    allowUnknownTags: true,
                },
                coreExtensions
            );

            const tagNode = node.expressions[0];
            expect(tagNode).toMatchSnapshot();
        });

        it('should parse an unknown "paginate" tag', function() {
            const node = parse(
                "{% paginate entries.section('blog').limit(10) as pageInfo, pageEntries %}",
                {
                    allowUnknownTags: true,
                },
                coreExtensions
            );

            const tagNode = node.expressions[0];
            expect(tagNode).toMatchSnapshot();
        });

        it('should parse an unknown "nav" tag', function() {
            const node = parse(
                `{%- nav items as item %}
                <li>{{ item.name }}</li>
                {% endnav -%}`,
                {
                    allowUnknownTags: true,
                    multiTags: { nav: ['endnav'] },
                },
                coreExtensions
            );

            const tagNode = node.expressions[0];
            expect(tagNode.trimLeft).toBe(true);
            expect(tagNode.trimRight).toBe(false);
            expect(tagNode.sections.length).toBe(2);
            expect(tagNode.sections[0].type).toBe('SequenceExpression');

            const endnavTag = tagNode.sections[1];
            expect(endnavTag.tagName).toBe('endnav');
            expect(endnavTag.type).toBe('GenericTwigTag');
            expect(endnavTag.trimLeft).toBe(false);
            expect(endnavTag.trimRight).toBe(true);
        });

        it('should parse an unknown tag with multiple sub-tags', function() {
            const node = parse(
                `{% myIf someCondition %}
                    Output A
                {%- myElseIf conditionB %}
                    Output B
                {% myElseIf conditionC %}
                    Output C
                {% myElse %}
                    Default
                {% myEndif %}`,
                {
                    allowUnknownTags: true,
                    multiTags: { myIf: ['myElseIf', 'myElse', 'myEndif'] },
                },
                coreExtensions
            );

            const tagNode = node.expressions[0];
            expect(tagNode.tagName).toBe('myIf');
            const sections = tagNode.sections;
            expect(sections[0].type).toBe('SequenceExpression');
            expect(sections[1].type).toBe('GenericTwigTag');
            expect(sections[1].tagName).toBe('myElseIf');
            expect(sections[2].type).toBe('SequenceExpression');
            expect(sections[3].type).toBe('GenericTwigTag');
            expect(sections[3].tagName).toBe('myElseIf');
            expect(sections[4].type).toBe('SequenceExpression');
            expect(sections[5].type).toBe('GenericTwigTag');
            expect(sections[5].tagName).toBe('myElse');
            expect(sections[6].type).toBe('SequenceExpression');
            expect(sections[7].type).toBe('GenericTwigTag');
            expect(sections[7].tagName).toBe('myEndif');
        });

        it('should preserve whitespace control information', function() {
            const node = parse(
                '{%- set count = 0 -%}',
                { applyWhitespaceTrimming: false },
                coreExtensions
            );

            expect(node).toMatchSnapshot();
        });
    });

    describe('when parsing HTML', function() {
        it('should parse an HTML 5 doctype declaration', function() {
            const node = parse('<!DOCTYPE html>', {
                ignoreDeclarations: false,
            });
            expect(node).toMatchSnapshot();
        });

        it('should parse an HTML 5 doctype declaration with whitespace after !', function() {
            const node = parse('<!   DOCTYPE html>', {
                ignoreDeclarations: false,
            });
            expect(node).toMatchSnapshot();
        });

        it('should parse an HTML 4 doctype declaration', function() {
            const node = parse(
                '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
                {
                    ignoreDeclarations: false,
                }
            );
            expect(node).toMatchSnapshot();
        });

        it('should parse a doctype declaration containing an expression', function() {
            const node = parse('<!DOCTYPE {{ theDocType }}>', {
                ignoreDeclarations: false,
            });
            expect(node).toMatchSnapshot();
        });

        it('should throw a controlled error on an interrupted doctype declaration', function() {
            try {
                parse('<!DOCTYPE ', {
                    ignoreDeclarations: false,
                });
            } catch (err) {
                expect(err).toMatchSnapshot();
            }
        });

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

        it('should match HTML comments', function() {
            const parser = createParserWithOptions('<span><!--//--></span>', {
                ignoreComments: false,
                ignoreHtmlComments: false,
            });
            const node = parser.parse();
            expect(node).toMatchSnapshot();
        });

        it('should match HTML comments mixed with other text', function() {
            const markup = `<span>
            First some text
            
            <!-- Then a comment-->
            </span>`;
            const parser = createParserWithOptions(markup, {
                ignoreComments: false,
                ignoreHtmlComments: false,
            });
            const node = parser.parse();
            expect(node).toMatchSnapshot();
        });

        it('should respect the decodeEntities option', function() {
            const parser = createParserWithOptions('<span>&#8206;</span>', {
                decodeEntities: false,
            });
            const node = parser.parse();
            expect(node).toMatchSnapshot();
        });

        it('should respect the preserveSourceLiterally option', function() {
            const parser = createParserWithOptions('<span>&#8206;</span>', {
                preserveSourceLiterally: true,
            });
            const node = parser.parse();
            expect(node).toMatchSnapshot();
        });

        it('should respect applyWhitespaceTrimming setting', function() {
            const parser = createParserWithOptions(
                '<span title="Testing: {{- noWhitespaceTest -}} foo">Test</span>',
                {
                    applyWhitespaceTrimming: false,
                }
            );
            const node = parser.parse();
            expect(node).toMatchSnapshot();
        });

        it('should put trimming information on a PrintExpressionStatement node', function() {
            const node = parse(`{{- foo -}}`);
            const expression = node.expressions[0];
            expect(expression.trimLeft).toBe(true);
            expect(expression.trimRight).toBe(true);
        });

        it('should put trimming information on a conditional expression', function () {
            const node = parse(
                `{{- ratingValue == 10 ? ratingValue : ratingValue -}}`,
                coreExtensions
            )

            const tagNode = node.expressions[0]
            expect(tagNode.trimLeft).toBe(true)
            expect(tagNode.trimRight).toBe(true)
        })
    });

    const addNotOperator = (parser, precedence = 500) => {
        parser.addUnaryOperator({
            text: 'not',
            precedence,
            createNode(token, expr) {
                return new n.UnaryExpression(token.text, expr);
            },
        });
    };

    const addInOperator = parser => {
        parser.addBinaryOperator({
            text: 'in',
            precedence: 400,
            associativity: LEFT,
            createNode(token, lhs, rhs) {
                return new n.BinaryExpression(token.text, lhs, rhs);
            },
        });
    };

    const addIsOperator = parser => {
        parser.addBinaryOperator({
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
                    new n.Identifier(test.text)
                );
                if (not) {
                    expr = new n.UnaryExpression('not', expr);
                }
                return expr;
            },
        });
    };

    describe('when reproducing the original source', function() {
        it('should reproduce the source of an identifier', function() {
            const source = '{{ hello }}';
            const sequenceExpr = parse(source);
            const printExprStatement = sequenceExpr.expressions[0];
            const identifier = printExprStatement.value;
            expect(getNodeSource(sequenceExpr, source)).toEqual(source);
            expect(getNodeSource(printExprStatement, source)).toEqual(source);
            expect(getNodeSource(identifier, source)).toEqual('hello');
        });

        it('should reproduce the source of a string literal', function() {
            const exprSource = '{{ "hello" }}';
            const source = `Before${exprSource}after`;
            const sequenceExpr = parse(source);
            const printExprStatement = sequenceExpr.expressions[1];
            const stringLiteral = printExprStatement.value;
            expect(getNodeSource(sequenceExpr, source)).toEqual(source);
            expect(getNodeSource(printExprStatement, source)).toEqual(
                exprSource
            );
            expect(getNodeSource(stringLiteral, source)).toEqual('"hello"');
        });

        it('should reproduce the source of a string interpolation', function() {
            const stringLiteral = '"Calling #{name} next"';
            const source = `Before{{ ${stringLiteral} }}After`;
            const sequenceExpr = parse(source);
            const concatExpression = sequenceExpr.expressions[1].value;
            expect(getNodeSource(concatExpression, source)).toEqual(
                stringLiteral
            );
        });

        it('should reproduce the source of unary expressions', function() {
            const exprSource = '{{ not foo }}';
            const source = `${exprSource}After`;
            const l = getLexer(source);
            l.addOperators('not');
            const p = getParser(l);
            addNotOperator(p);
            const sequenceExpr = p.parse();
            const unaryExpression = sequenceExpr.expressions[0].value;
            expect(getNodeSource(sequenceExpr, source)).toEqual(source);
            expect(getNodeSource(unaryExpression, source)).toEqual('not foo');
        });

        it('should reproduce the source of binary expressions', function() {
            const exprSource = 'foo in bar';
            const source = `<span>Is it true? </span>{{ ${exprSource} }}---`;
            const l = getLexer(source);
            l.addOperators('in');
            const p = getParser(l);
            addInOperator(p);
            const sequenceExpr = p.parse();
            const binaryExpression = sequenceExpr.expressions[1].value;
            expect(getNodeSource(sequenceExpr, source)).toEqual(source);
            expect(getNodeSource(binaryExpression, source)).toEqual(exprSource);
        });

        it('should reproduce the source of a conditional expression', function() {
            const exprSource = 'hasResults ? resultCount : 0';
            const source = `Before {{ ${exprSource} }}after`;
            const sequenceExpr = parse(source);
            const conditionalExpression = sequenceExpr.expressions[1].value;
            expect(getNodeSource(conditionalExpression, source)).toEqual(
                exprSource
            );
        });

        it('should reproduce the source of self-parsing binary operators', function() {
            const exprSource = 'foo is not defined';
            const source = `Before {{ ${exprSource} }} after`;
            const lexer = getLexer(source);
            lexer.addOperators('not', 'is');
            const p = getParser(lexer);
            addNotOperator(p);
            addIsOperator(p);
            const node = p.parse();
            const expression = node.expressions[1].value;
            expect(getNodeSource(expression, source)).toEqual(exprSource);
        });

        const testExpressionSourceReproduction = exprSource => {
            const source = `Before {{ ${exprSource} }} after`;
            const node = parse(source);
            const expression = node.expressions[1].value;
            expect(getNodeSource(expression, source)).toEqual(exprSource);
        };

        it('should reproduce the source of a call expression', function() {
            testExpressionSourceReproduction('lower("ABCD")');
        });

        it('should reproduce the source of a complex call expression', function() {
            testExpressionSourceReproduction(
                'hello({ test: "bar", foo: test}, [1, 2, 3, test])'
            );
        });

        it('should reproduce the source of a Twig comment', function() {
            const commentSource = '{# The soup today was delicious #}';
            const source = `Before ${commentSource} after`;
            const node = parse(source, { ignoreComments: false });
            const comment = node.expressions[1];
            expect(getNodeSource(comment, source)).toEqual(commentSource);
        });

        it('should reproduce the source of an HTML comment', function() {
            const commentSource = '<!-- The pasta today was delicious -->';
            const source = `Before ${commentSource} after`;
            const node = parse(source, { ignoreHtmlComments: false });
            const comment = node.expressions[1];
            expect(getNodeSource(comment, source)).toEqual(commentSource);
        });

        it('should reproduce the source of simple text', function() {
            const textSource = `This will be the story 
            of young Huckleberry Finn 
            who lived on the banks of 
            the Mississippi`;
            const source = `<img src="none">${textSource}<span>The end</span>`;
            const node = parse(source);
            const textStatement = node.expressions[1];
            expect(getNodeSource(textStatement, source)).toEqual(textSource);
        });

        it('should reproduce the source of a filter expression', function() {
            const filterSource = 'a | default(null) ? false : true';
            const source = `{{ ${filterSource} }}`;
            const node = parse(source);
            const conditionalExpression = node.expressions[0].value;
            expect(getNodeSource(conditionalExpression, source)).toEqual(
                filterSource
            );
            expect(getNodeSource(conditionalExpression.test, source)).toEqual(
                'a | default(null)'
            );
        });

        it('should reproduce the source of HTML elements', function() {
            const divSource = `<div class="shadow">
            This is <span>fine</span>.
            </div>`;
            const source = `Before ${divSource} after`;
            const node = parse(source);
            const htmlElement = node.expressions[1];
            expect(getNodeSource(htmlElement, source)).toEqual(divSource);
        });
    });
});

function getParser(lexer, options) {
    return new Parser(new TokenStream(lexer), options);
}

function getLexer(code) {
    return new Lexer(new CharStream(code));
}
