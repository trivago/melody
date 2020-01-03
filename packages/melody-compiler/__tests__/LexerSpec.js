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
import { CharStream, Lexer, Types } from 'melody-parser';

describe('Lexer', () => {
    it('should match text', () => {
        var lexer = new Lexer(new CharStream(' hello world '));
        var token = lexer.next();
        expect(token.type).toEqual(Types.TEXT);
        expect(token.text).toEqual(' hello world ');
    });

    it('should match strings', () => {
        var lexer = new Lexer(new CharStream('{{ "hello world #{foo} " }}'));
        var token = lexer.next();
        expect(token.type).toEqual(Types.EXPRESSION_START);
        token = lexer.next();
        expect(token.type).toEqual(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING_START);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING);
        expect(token.text).toEqual('hello world ');
        token = lexer.next();
        expect(token.type).toEqual(Types.INTERPOLATION_START);
        token = lexer.next();
        expect(token.type).toEqual(Types.SYMBOL);
        expect(token.text).toEqual('foo');
        token = lexer.next();
        expect(token.type).toEqual(Types.INTERPOLATION_END);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING);
        expect(token.text).toEqual(' ');
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING_END);
        token = lexer.next();
        expect(token.type).toEqual(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).toEqual(Types.EXPRESSION_END);
    });

    it('should match strings', () => {
        var lexer = new Lexer(new CharStream('{{ "hello world #{foo}" }}'));
        var token = lexer.next();
        expect(token.type).toEqual(Types.EXPRESSION_START);
        token = lexer.next();
        expect(token.type).toEqual(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING_START);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING);
        expect(token.text).toEqual('hello world ');
        token = lexer.next();
        expect(token.type).toEqual(Types.INTERPOLATION_START);
        token = lexer.next();
        expect(token.type).toEqual(Types.SYMBOL);
        expect(token.text).toEqual('foo');
        token = lexer.next();
        expect(token.type).toEqual(Types.INTERPOLATION_END);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING_END);
        token = lexer.next();
        expect(token.type).toEqual(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).toEqual(Types.EXPRESSION_END);
    });

    it('should match text 2', () => {
        var lexer = new Lexer(new CharStream('hello {world'));
        var token = lexer.next();
        expect(token.type).toEqual(Types.TEXT);
        expect(token.text).toEqual('hello {world');
    });

    it('should match comments', () => {
        var lexer = new Lexer(new CharStream('hello {# cruel #} world')),
            token = lexer.next();
        expect(token.type).toEqual(Types.TEXT);
        expect(token.text).toEqual('hello ');
        token = lexer.next();
        expect(token.text).toEqual('{# cruel #}');
        expect(token.type).toEqual(Types.COMMENT);
        token = lexer.next();
        expect(token.text).toEqual(' world');
        expect(token.type).toEqual(Types.TEXT);
    });

    describe('in expression state', function() {
        it('should parse an expression that is a string', () => {
            var lexer = new Lexer(
                    new CharStream(' hello {{- "test " -}} world')
                ),
                token = lexer.next();
            expect(token.type).toEqual(Types.TEXT);
            expect(token.text).toEqual(' hello ');
            token = lexer.next();
            expect(token.text).toEqual('{{-');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_START);
            token = lexer.next();
            expect(token.text).toEqual('test ');
            expect(token.type).toEqual(Types.STRING);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_END);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('-}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).toEqual(' world');
            expect(token.type).toEqual(Types.TEXT);
        });

        it('should parse an expression that is a string and contains escaped quotes', () => {
            var lexer = new Lexer(
                    new CharStream(
                        "hello {{ 'test\\'n this \\'n other' }}world"
                    )
                ),
                token = lexer.next();
            expect(token.type).toEqual(Types.TEXT);
            expect(token.text).toEqual('hello ');
            expect(token.pos.column).toEqual(0);
            token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            expect(token.pos.column).toEqual(6);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_START);
            token = lexer.next();
            expect(token.text).toEqual("test'n this 'n other");
            expect(token.type).toEqual(Types.STRING);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_END);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).toEqual('world');
            expect(token.type).toEqual(Types.TEXT);
        });

        it('should parse a string expression with a newline escape sequence', () => {
            var lexer = new Lexer(
                    new CharStream("{{ 'Line one\\nline two' }}")
                ),
                token = lexer.next();
            token = lexer.next(); // WHITESPACE
            token = lexer.next(); // STRING_START
            token = lexer.next();
            expect(token.text).toEqual('Line one\\nline two');
            expect(token.type).toEqual(Types.STRING);
        });

        it('should parse an expression that is a integer', () => {
            var lexer = new Lexer(new CharStream('{{ 100 }}')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('100');
            expect(token.type).toEqual(Types.NUMBER);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        it('should parse an expression that is a float', () => {
            var lexer = new Lexer(new CharStream('{{ 1.01 }}')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('1.01');
            expect(token.type).toEqual(Types.NUMBER);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        it('should parse an expression that is true', () => {
            var lexer = new Lexer(new CharStream('{{ true }}')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('true');
            expect(token.type).toEqual(Types.TRUE);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        it('should parse an expression that is false', () => {
            var lexer = new Lexer(new CharStream('{{ false }}')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('false');
            expect(token.type).toEqual(Types.FALSE);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        it('should parse an expression that is null', () => {
            var lexer = new Lexer(new CharStream('{{null}}')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('null');
            expect(token.type).toEqual(Types.NULL);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('(');
            expect(token.type).toEqual(Types.LPAREN);
        });

        it('should parse an expression that is )', () => {
            var lexer = new Lexer(new CharStream('{{)')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual(')');
            expect(token.type).toEqual(Types.RPAREN);
        });

        it('should parse an expression that is [', () => {
            var lexer = new Lexer(new CharStream('{{[')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('[');
            expect(token.type).toEqual(Types.LBRACE);
        });

        it('should parse an expression that is ]', () => {
            var lexer = new Lexer(new CharStream('{{]')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual(']');
            expect(token.type).toEqual(Types.RBRACE);
        });

        it('should parse an expression that is }', () => {
            var lexer = new Lexer(new CharStream('{{}')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('}');
            expect(token.type).toEqual(Types.RBRACKET);
        });

        it('should parse an expression that is {', () => {
            var lexer = new Lexer(new CharStream('{{{')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('{');
            expect(token.type).toEqual(Types.LBRACKET);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('(');
            expect(token.type).toEqual(Types.LPAREN);
        });

        it('should parse an expression that is )', () => {
            var lexer = new Lexer(new CharStream('{{)')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual(')');
            expect(token.type).toEqual(Types.RPAREN);
        });

        it('should parse an expression that is :', () => {
            var lexer = new Lexer(new CharStream('{{:')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual(':');
            expect(token.type).toEqual(Types.COLON);
        });

        it('should parse an expression that is .', () => {
            var lexer = new Lexer(new CharStream('{{.')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('.');
            expect(token.type).toEqual(Types.DOT);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('(');
            expect(token.type).toEqual(Types.LPAREN);
        });

        it('should parse an expression that is ,', () => {
            var lexer = new Lexer(new CharStream('{{,')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual(',');
            expect(token.type).toEqual(Types.COMMA);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('(');
            expect(token.type).toEqual(Types.LPAREN);
        });

        it('should parse an expression that is a symbol', () => {
            var lexer = new Lexer(new CharStream('{{ foo }}')),
                token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('foo');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        it('should match an operator by length', () => {
            var lexer = new Lexer(new CharStream('{{ foo in by bar }}')),
                token;
            lexer.addOperators('in', 'in by');
            token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('foo');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('in by');
            expect(token.type).toEqual(Types.OPERATOR);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('bar');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        it('should match a not expression', () => {
            var lexer = new Lexer(new CharStream('{{ not invalid }}')),
                token;
            lexer.addOperators('not', 'not in');
            token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('not');
            expect(token.type).toEqual(Types.OPERATOR);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('invalid');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
        });

        //it('should match a test by length', () => {
        //    var lexer = new Lexer(new CharStream(`{{ foo is divisible by bar }}`)),
        //        token;
        //    lexer.addOperators('is');
        //    lexer.addTests('divisible', 'divisible by');
        //    token = lexer.next();
        //    expect(token.text).toEqual('{{');
        //    expect(token.type).toEqual(Types.EXPRESSION_START);
        //    token = lexer.next();
        //    expect(token.text).toEqual("foo");
        //    expect(token.type).toEqual(Types.SYMBOL);
        //    token = lexer.next();
        //    expect(token.text).toEqual("is");
        //    expect(token.type).toEqual(Types.OPERATOR);
        //    token = lexer.next();
        //    expect(token.text).toEqual("divisible by");
        //    expect(token.type).toEqual(Types.TEST);
        //    token = lexer.next();
        //    expect(token.text).toEqual("bar");
        //    expect(token.type).toEqual(Types.SYMBOL);
        //    token = lexer.next();
        //    expect(token.text).toEqual('}}');
        //    expect(token.type).toEqual(Types.EXPRESSION_END);
        //});
    });

    describe('in tag state', function() {
        it('should match a tag', function() {
            var lexer = new Lexer(new CharStream('{% if %}')),
                token;
            token = lexer.next();
            expect(token.text).toEqual('{%');
            expect(token.type).toEqual(Types.TAG_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('if');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('%}');
            expect(token.type).toEqual(Types.TAG_END);
        });

        it('should match an extends tag', function() {
            var lexer = new Lexer(
                    new CharStream('{% extends "foo.html.twig" %}')
                ),
                token;
            lexer.addOperators('+');
            token = lexer.next();
            expect(token.text).toEqual('{%');
            expect(token.type).toEqual(Types.TAG_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('extends');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING);
            expect(token.text).toEqual('foo.html.twig');
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_END);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('%}');
            expect(token.type).toEqual(Types.TAG_END);
        });
    });

    describe('when matching html', () => {
        it('should match simple HTML', () => {
            var lexer = new Lexer(new CharStream('<div>Test</div>')),
                token;
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).toEqual('Test');
            expect(token.type).toEqual(Types.TEXT);
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.type).toEqual(Types.SLASH);
            expect(token.text).toEqual('/');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
        });

        it('should match simple HTML attributes', () => {
            var lexer = new Lexer(
                    new CharStream('<div class="foo">Test</div>')
                ),
                token;
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('class');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('=');
            expect(token.type).toEqual(Types.ASSIGNMENT);
            token = lexer.next();
            expect(token.text).toEqual('"');
            expect(token.type).toEqual(Types.STRING_START);
            token = lexer.next();
            expect(token.text).toEqual('foo');
            expect(token.type).toEqual(Types.STRING);
            token = lexer.next();
            expect(token.text).toEqual('"');
            expect(token.type).toEqual(Types.STRING_END);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).toEqual('Test');
            expect(token.type).toEqual(Types.TEXT);
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.type).toEqual(Types.SLASH);
            expect(token.text).toEqual('/');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
        });

        it('should match simple HTML attributes with expression value', () => {
            var lexer = new Lexer(
                    new CharStream('<div class="{{name}}">Test</div>')
                ),
                token;
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('class');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('=');
            expect(token.type).toEqual(Types.ASSIGNMENT);
            token = lexer.next();
            expect(token.text).toEqual('"');
            expect(token.type).toEqual(Types.STRING_START);
            token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('name');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).toEqual('"');
            expect(token.type).toEqual(Types.STRING_END);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).toEqual('Test');
            expect(token.type).toEqual(Types.TEXT);
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.type).toEqual(Types.SLASH);
            expect(token.text).toEqual('/');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
        });

        it('should match HTML attributes with mixed values', () => {
            var lexer = new Lexer(
                    new CharStream('<div class="test-{{name}} foo">Test</div>')
                ),
                token;
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).toEqual('class');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('=');
            expect(token.type).toEqual(Types.ASSIGNMENT);
            token = lexer.next();
            expect(token.text).toEqual('"');
            expect(token.type).toEqual(Types.STRING_START);
            token = lexer.next();
            expect(token.text).toEqual('test-');
            expect(token.type).toEqual(Types.STRING);
            token = lexer.next();
            expect(token.text).toEqual('{{');
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).toEqual('name');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('}}');
            expect(token.type).toEqual(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).toEqual(' foo');
            expect(token.type).toEqual(Types.STRING);
            token = lexer.next();
            expect(token.text).toEqual('"');
            expect(token.type).toEqual(Types.STRING_END);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).toEqual('Test');
            expect(token.type).toEqual(Types.TEXT);
            token = lexer.next();
            expect(token.type).toEqual(Types.ELEMENT_START);
            expect(token.text).toEqual('<');
            token = lexer.next();
            expect(token.type).toEqual(Types.SLASH);
            expect(token.text).toEqual('/');
            token = lexer.next();
            expect(token.text).toEqual('div');
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).toEqual('>');
            expect(token.type).toEqual(Types.ELEMENT_END);
        });

        it('should keep quotes in interpolation', () => {
            var lexer = new Lexer(
                    new CharStream(
                        '{{ even ? \'class="#{evenClass}" data-even\' }}'
                    )
                ),
                token;
            token = lexer.next();
            expect(token.type).toEqual(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).toEqual(Types.QUESTION_MARK);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING);
            expect(token.text).toEqual('class="');
            token = lexer.next();
            expect(token.type).toEqual(Types.INTERPOLATION_START);
            token = lexer.next();
            expect(token.type).toEqual(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).toEqual(Types.INTERPOLATION_END);
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING);
            expect(token.text).toEqual('" data-even');
            token = lexer.next();
            expect(token.type).toEqual(Types.STRING_END);
            token = lexer.next();
            expect(token.type).toEqual(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).toEqual(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.type).toEqual(Types.EOF);
        });
    });
});
