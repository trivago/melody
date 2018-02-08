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
import { expect } from 'chai';
import { CharStream, EOF, Lexer, Types } from 'melody-parser';

describe('Lexer', () => {
    it('should match text', () => {
        var lexer = new Lexer(new CharStream(' hello world '));
        var token = lexer.next();
        expect(token.type).to.eql(Types.TEXT);
        expect(token.text).to.eql(' hello world ');
    });

    it('should match strings', () => {
        var lexer = new Lexer(new CharStream('{{ "hello world #{foo} " }}'));
        var token = lexer.next();
        expect(token.type).to.eql(Types.EXPRESSION_START);
        token = lexer.next();
        expect(token.type).to.eql(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).to.eql(Types.STRING_START);
        token = lexer.next();
        expect(token.type).to.eql(Types.STRING);
        expect(token.text).to.eql('hello world ');
        token = lexer.next();
        expect(token.type).to.eql(Types.INTERPOLATION_START);
        token = lexer.next();
        expect(token.type).to.eql(Types.SYMBOL);
        expect(token.text).to.eql('foo');
        token = lexer.next();
        expect(token.type).to.eql(Types.INTERPOLATION_END);
        token = lexer.next();
        expect(token.type).to.eql(Types.STRING);
        expect(token.text).to.eql(' ');
        token = lexer.next();
        expect(token.type).to.eql(Types.STRING_END);
        token = lexer.next();
        expect(token.type).to.eql(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).to.eql(Types.EXPRESSION_END);
    });

    it('should match strings', () => {
        var lexer = new Lexer(new CharStream('{{ "hello world #{foo}" }}'));
        var token = lexer.next();
        expect(token.type).to.eql(Types.EXPRESSION_START);
        token = lexer.next();
        expect(token.type).to.eql(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).to.eql(Types.STRING_START);
        token = lexer.next();
        expect(token.type).to.eql(Types.STRING);
        expect(token.text).to.eql('hello world ');
        token = lexer.next();
        expect(token.type).to.eql(Types.INTERPOLATION_START);
        token = lexer.next();
        expect(token.type).to.eql(Types.SYMBOL);
        expect(token.text).to.eql('foo');
        token = lexer.next();
        expect(token.type).to.eql(Types.INTERPOLATION_END);
        token = lexer.next();
        expect(token.type).to.eql(Types.STRING_END);
        token = lexer.next();
        expect(token.type).to.eql(Types.WHITESPACE);
        token = lexer.next();
        expect(token.type).to.eql(Types.EXPRESSION_END);
    });

    it('should match text 2', () => {
        var lexer = new Lexer(new CharStream('hello {world'));
        var token = lexer.next();
        expect(token.type).to.eql(Types.TEXT);
        expect(token.text).to.eql('hello {world');
    });

    it('should match comments', () => {
        var lexer = new Lexer(new CharStream('hello {# cruel #} world')),
            token = lexer.next();
        expect(token.type).to.eql(Types.TEXT);
        expect(token.text).to.eql('hello ');
        token = lexer.next();
        expect(token.text).to.equal('{# cruel #}');
        expect(token.type).to.equal(Types.COMMENT);
        token = lexer.next();
        expect(token.text).to.equal(' world');
        expect(token.type).to.equal(Types.TEXT);
    });

    describe('in expression state', function() {
        it('should parse an expression that is a string', () => {
            var lexer = new Lexer(
                    new CharStream(' hello {{- "test " -}} world')
                ),
                token = lexer.next();
            expect(token.type).to.eql(Types.TEXT);
            expect(token.text).to.eql(' hello ');
            token = lexer.next();
            expect(token.text).to.equal('{{-');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).to.eql(Types.STRING_START);
            token = lexer.next();
            expect(token.text).to.equal('test ');
            expect(token.type).to.equal(Types.STRING);
            token = lexer.next();
            expect(token.type).to.eql(Types.STRING_END);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('-}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).to.equal(' world');
            expect(token.type).to.equal(Types.TEXT);
        });

        it('should parse an expression that is a string and contains escaping', () => {
            var lexer = new Lexer(
                    new CharStream("hello {{ 'test\\'n this' }}world")
                ),
                token = lexer.next();
            expect(token.type).to.eql(Types.TEXT);
            expect(token.text).to.eql('hello ');
            expect(token.pos.column).to.equal(0);
            token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            expect(token.pos.column).to.equal(6);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).to.eql(Types.STRING_START);
            token = lexer.next();
            expect(token.text).to.equal("test'n this");
            expect(token.type).to.equal(Types.STRING);
            token = lexer.next();
            expect(token.type).to.eql(Types.STRING_END);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).to.equal('world');
            expect(token.type).to.equal(Types.TEXT);
        });

        it('should parse an expression that is a integer', () => {
            var lexer = new Lexer(new CharStream('{{ 100 }}')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('100');
            expect(token.type).to.equal(Types.NUMBER);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        it('should parse an expression that is a float', () => {
            var lexer = new Lexer(new CharStream('{{ 1.01 }}')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('1.01');
            expect(token.type).to.equal(Types.NUMBER);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        it('should parse an expression that is true', () => {
            var lexer = new Lexer(new CharStream('{{ true }}')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('true');
            expect(token.type).to.equal(Types.TRUE);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        it('should parse an expression that is false', () => {
            var lexer = new Lexer(new CharStream('{{ false }}')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('false');
            expect(token.type).to.equal(Types.FALSE);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        it('should parse an expression that is null', () => {
            var lexer = new Lexer(new CharStream('{{null}}')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('null');
            expect(token.type).to.equal(Types.NULL);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('(');
            expect(token.type).to.equal(Types.LPAREN);
        });

        it('should parse an expression that is )', () => {
            var lexer = new Lexer(new CharStream('{{)')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal(')');
            expect(token.type).to.equal(Types.RPAREN);
        });

        it('should parse an expression that is [', () => {
            var lexer = new Lexer(new CharStream('{{[')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('[');
            expect(token.type).to.equal(Types.LBRACE);
        });

        it('should parse an expression that is ]', () => {
            var lexer = new Lexer(new CharStream('{{]')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal(']');
            expect(token.type).to.equal(Types.RBRACE);
        });

        it('should parse an expression that is }', () => {
            var lexer = new Lexer(new CharStream('{{}')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('}');
            expect(token.type).to.equal(Types.RBRACKET);
        });

        it('should parse an expression that is {', () => {
            var lexer = new Lexer(new CharStream('{{{')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('{');
            expect(token.type).to.equal(Types.LBRACKET);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('(');
            expect(token.type).to.equal(Types.LPAREN);
        });

        it('should parse an expression that is )', () => {
            var lexer = new Lexer(new CharStream('{{)')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal(')');
            expect(token.type).to.equal(Types.RPAREN);
        });

        it('should parse an expression that is :', () => {
            var lexer = new Lexer(new CharStream('{{:')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal(':');
            expect(token.type).to.equal(Types.COLON);
        });

        it('should parse an expression that is .', () => {
            var lexer = new Lexer(new CharStream('{{.')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('.');
            expect(token.type).to.equal(Types.DOT);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('(');
            expect(token.type).to.equal(Types.LPAREN);
        });

        it('should parse an expression that is ,', () => {
            var lexer = new Lexer(new CharStream('{{,')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal(',');
            expect(token.type).to.equal(Types.COMMA);
        });

        it('should parse an expression that is (', () => {
            var lexer = new Lexer(new CharStream('{{(')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('(');
            expect(token.type).to.equal(Types.LPAREN);
        });

        it('should parse an expression that is a symbol', () => {
            var lexer = new Lexer(new CharStream('{{ foo }}')),
                token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('foo');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        it('should match an operator by length', () => {
            var lexer = new Lexer(new CharStream('{{ foo in by bar }}')),
                token;
            lexer.addOperators('in', 'in by');
            token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('foo');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('in by');
            expect(token.type).to.equal(Types.OPERATOR);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('bar');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        it('should match a not expression', () => {
            var lexer = new Lexer(new CharStream('{{ not invalid }}')),
                token;
            lexer.addOperators('not', 'not in');
            token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.equal(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('not');
            expect(token.type).to.equal(Types.OPERATOR);
            token = lexer.next();
            expect(token.type).to.equal(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('invalid');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.equal(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
        });

        //it('should match a test by length', () => {
        //    var lexer = new Lexer(new CharStream(`{{ foo is divisible by bar }}`)),
        //        token;
        //    lexer.addOperators('is');
        //    lexer.addTests('divisible', 'divisible by');
        //    token = lexer.next();
        //    expect(token.text).to.equal('{{');
        //    expect(token.type).to.equal(Types.EXPRESSION_START);
        //    token = lexer.next();
        //    expect(token.text).to.equal("foo");
        //    expect(token.type).to.equal(Types.SYMBOL);
        //    token = lexer.next();
        //    expect(token.text).to.equal("is");
        //    expect(token.type).to.equal(Types.OPERATOR);
        //    token = lexer.next();
        //    expect(token.text).to.equal("divisible by");
        //    expect(token.type).to.equal(Types.TEST);
        //    token = lexer.next();
        //    expect(token.text).to.equal("bar");
        //    expect(token.type).to.equal(Types.SYMBOL);
        //    token = lexer.next();
        //    expect(token.text).to.equal('}}');
        //    expect(token.type).to.equal(Types.EXPRESSION_END);
        //});
    });

    describe('in tag state', function() {
        it('should match a tag', function() {
            var lexer = new Lexer(new CharStream('{% if %}')),
                token;
            token = lexer.next();
            expect(token.text).to.equal('{%');
            expect(token.type).to.equal(Types.TAG_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('if');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('%}');
            expect(token.type).to.equal(Types.TAG_END);
        });

        it('should match an extends tag', function() {
            var lexer = new Lexer(
                    new CharStream('{% extends "foo.html.twig" %}')
                ),
                token;
            lexer.addOperators('+');
            token = lexer.next();
            expect(token.text).to.equal('{%');
            expect(token.type).to.equal(Types.TAG_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('extends');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).to.eql(Types.STRING_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.STRING);
            expect(token.text).to.equal('foo.html.twig');
            token = lexer.next();
            expect(token.type).to.eql(Types.STRING_END);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('%}');
            expect(token.type).to.equal(Types.TAG_END);
        });
    });

    describe('when matching html', () => {
        it('should match simple HTML', () => {
            var lexer = new Lexer(new CharStream('<div>Test</div>')),
                token;
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).to.equal('Test');
            expect(token.type).to.equal(Types.TEXT);
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.type).to.equal(Types.SLASH);
            expect(token.text).to.equal('/');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
        });

        it('should match simple HTML attributes', () => {
            var lexer = new Lexer(
                    new CharStream('<div class="foo">Test</div>')
                ),
                token;
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('class');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('=');
            expect(token.type).to.equal(Types.ASSIGNMENT);
            token = lexer.next();
            expect(token.text).to.equal('"');
            expect(token.type).to.equal(Types.STRING_START);
            token = lexer.next();
            expect(token.text).to.equal('foo');
            expect(token.type).to.equal(Types.STRING);
            token = lexer.next();
            expect(token.text).to.equal('"');
            expect(token.type).to.equal(Types.STRING_END);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).to.equal('Test');
            expect(token.type).to.equal(Types.TEXT);
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.type).to.equal(Types.SLASH);
            expect(token.text).to.equal('/');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
        });

        it('should match simple HTML attributes with expression value', () => {
            var lexer = new Lexer(
                    new CharStream('<div class="{{name}}">Test</div>')
                ),
                token;
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('class');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('=');
            expect(token.type).to.equal(Types.ASSIGNMENT);
            token = lexer.next();
            expect(token.text).to.equal('"');
            expect(token.type).to.equal(Types.STRING_START);
            token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('name');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).to.equal('"');
            expect(token.type).to.equal(Types.STRING_END);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).to.equal('Test');
            expect(token.type).to.equal(Types.TEXT);
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.type).to.equal(Types.SLASH);
            expect(token.text).to.equal('/');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
        });

        it('should match HTML attributes with mixed values', () => {
            var lexer = new Lexer(
                    new CharStream('<div class="test-{{name}} foo">Test</div>')
                ),
                token;
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.text).to.equal('class');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('=');
            expect(token.type).to.equal(Types.ASSIGNMENT);
            token = lexer.next();
            expect(token.text).to.equal('"');
            expect(token.type).to.equal(Types.STRING_START);
            token = lexer.next();
            expect(token.text).to.equal('test-');
            expect(token.type).to.equal(Types.STRING);
            token = lexer.next();
            expect(token.text).to.equal('{{');
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.text).to.equal('name');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('}}');
            expect(token.type).to.equal(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.text).to.equal(' foo');
            expect(token.type).to.equal(Types.STRING);
            token = lexer.next();
            expect(token.text).to.equal('"');
            expect(token.type).to.equal(Types.STRING_END);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
            token = lexer.next();
            expect(token.text).to.equal('Test');
            expect(token.type).to.equal(Types.TEXT);
            token = lexer.next();
            expect(token.type).to.equal(Types.ELEMENT_START);
            expect(token.text).to.equal('<');
            token = lexer.next();
            expect(token.type).to.equal(Types.SLASH);
            expect(token.text).to.equal('/');
            token = lexer.next();
            expect(token.text).to.equal('div');
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.text).to.equal('>');
            expect(token.type).to.equal(Types.ELEMENT_END);
        });

        it('should keep quotes in interpolation', () => {
            var lexer = new Lexer(
                    new CharStream(
                        '{{ even ? \'class="#{evenClass}" data-even\' }}'
                    )
                ),
                token;
            token = lexer.next();
            expect(token.type).to.equal(Types.EXPRESSION_START);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).to.equal(Types.QUESTION_MARK);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).to.equal(Types.STRING_START);
            token = lexer.next();
            expect(token.type).to.equal(Types.STRING);
            expect(token.text).to.equal('class="');
            token = lexer.next();
            expect(token.type).to.equal(Types.INTERPOLATION_START);
            token = lexer.next();
            expect(token.type).to.equal(Types.SYMBOL);
            token = lexer.next();
            expect(token.type).to.equal(Types.INTERPOLATION_END);
            token = lexer.next();
            expect(token.type).to.equal(Types.STRING);
            expect(token.text).to.equal('" data-even');
            token = lexer.next();
            expect(token.type).to.equal(Types.STRING_END);
            token = lexer.next();
            expect(token.type).to.eql(Types.WHITESPACE);
            token = lexer.next();
            expect(token.type).to.equal(Types.EXPRESSION_END);
            token = lexer.next();
            expect(token.type).to.equal(Types.EOF);
        });
    });
});
