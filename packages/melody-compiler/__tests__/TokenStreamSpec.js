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
import { CharStream, Lexer, TokenStream, Types } from 'melody-parser';

describe('TokenStream', function() {
    it('should parse an expression', function() {
        let stream = createTokenStream('Hello {{ "Patrick" }}');
        expect(stream.test(Types.TEXT, 'Hello ')).toBeTruthy();
        stream.next();
        expect(stream.test(Types.EXPRESSION_START)).toBeTruthy();
        stream.next();
        expect(stream.test(Types.STRING_START)).toBeTruthy();
        stream.next();
        expect(stream.test(Types.STRING, 'Patrick')).toBeTruthy();
        stream.next();
        expect(stream.test(Types.STRING_END)).toBeTruthy();
        stream.next();
        expect(stream.test(Types.EXPRESSION_END)).toBeTruthy();
        stream.next();
        expect(stream.test(Types.TEXT)).toBeFalsy();
        stream.next();
    });

    it('should match an extends tag', function() {
        var lexer = createTokenStream('{% extends "foo.html.twig" %}'),
            token;
        token = lexer.next();
        expect(token.text).toEqual('{%');
        expect(token.type).toEqual(Types.TAG_START);
        token = lexer.next();
        expect(token.text).toEqual('extends');
        expect(token.type).toEqual(Types.SYMBOL);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING_START);
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING);
        expect(token.text).toEqual('foo.html.twig');
        token = lexer.next();
        expect(token.type).toEqual(Types.STRING_END);
        token = lexer.next();
        expect(token.text).toEqual('%}');
        expect(token.type).toEqual(Types.TAG_END);
    });
});

function createTokenStream(code) {
    return new TokenStream(new Lexer(new CharStream(code)));
}
