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
import { CharStream, EOF } from 'melody-parser';

describe('CharStream', function() {
    describe('#la', function() {
        it('should return EOF at the end of input', function() {
            var stream = new CharStream('');
            expect(stream.la(1)).toEqual(EOF);
        });

        it('should return EOF when looking beyond the end of input', () => {
            var stream = new CharStream('hello');
            expect(stream.la(10)).toEqual(EOF);
        });

        it('should return the char at the specified offset', () => {
            var stream = new CharStream('hello');
            expect(stream.la(0)).toEqual('h');
            expect(stream.la(1)).toEqual('e');
            expect(stream.la(2)).toEqual('l');
            expect(stream.la(3)).toEqual('l');
            expect(stream.la(4)).toEqual('o');
            expect(stream.la(5)).toEqual(EOF);
        });

        it('should return the char from the current position', () => {
            var stream = new CharStream('hello');
            stream.next();
            stream.next();
            expect(stream.la(0)).toEqual('l');
            expect(stream.la(1)).toEqual('l');
            expect(stream.la(2)).toEqual('o');
            expect(stream.la(3)).toEqual(EOF);
        });
    });

    describe('#next', () => {
        it('should advance to the next character', () => {
            var stream = new CharStream('hello');
            stream.next();
            expect(stream.la(0)).toEqual('e');
        });

        it('should return the current character', () => {
            var stream = new CharStream('hello');
            expect(stream.next()).toEqual('h');
            expect(stream.next()).toEqual('e');
            expect(stream.next()).toEqual('l');
            expect(stream.next()).toEqual('l');
            expect(stream.next()).toEqual('o');
            expect(stream.next()).toEqual(EOF);
        });

        it('should update the line info', () => {
            var stream = new CharStream(`hello
            world`);
            expect(stream.match('hello')).toBeTruthy();
            stream.next();
            expect(stream.mark()).toEqual({ line: 2, column: 0, index: 6 });
        });
    });

    describe('#mark', () => {
        it('should rewind to the marked position', () => {
            var stream = new CharStream('hello'),
                start = stream.mark();
            expect(stream.next()).toEqual('h');
            expect(stream.next()).toEqual('e');
            expect(stream.next()).toEqual('l');
            expect(stream.next()).toEqual('l');
            expect(stream.next()).toEqual('o');
            stream.rewind(start);
            expect(stream.next()).toEqual('h');
        });
    });

    describe('#match', () => {
        it('should match a string', () => {
            var stream = new CharStream('hello');
            expect(stream.match('he')).toBeTruthy();
            expect(stream.match('llo')).toBeTruthy();
        });

        it('should fail if no match', () => {
            var stream = new CharStream('hello');
            expect(stream.match('hello world')).toBeFalsy();
            expect(stream.match('hello')).toBeTruthy();
        });
    });
});
