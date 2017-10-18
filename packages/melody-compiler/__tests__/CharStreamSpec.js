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
import { CharStream, EOF } from 'melody-parser';

describe('CharStream', function() {
    describe('#la', function() {
        it('should return EOF at the end of input', function() {
            var stream = new CharStream('');
            expect(stream.la(1)).to.equal(EOF);
        });

        it('should return EOF when looking beyond the end of input', () => {
            var stream = new CharStream('hello');
            expect(stream.la(10)).to.equal(EOF);
        });

        it('should return the char at the specified offset', () => {
            var stream = new CharStream('hello');
            expect(stream.la(0)).to.eql('h');
            expect(stream.la(1)).to.eql('e');
            expect(stream.la(2)).to.eql('l');
            expect(stream.la(3)).to.eql('l');
            expect(stream.la(4)).to.eql('o');
            expect(stream.la(5)).to.equal(EOF);
        });

        it('should return the char from the current position', () => {
            var stream = new CharStream('hello');
            stream.next();
            stream.next();
            expect(stream.la(0)).to.eql('l');
            expect(stream.la(1)).to.eql('l');
            expect(stream.la(2)).to.eql('o');
            expect(stream.la(3)).to.equal(EOF);
        });
    });

    describe('#next', () => {
        it('should advance to the next character', () => {
            var stream = new CharStream('hello');
            stream.next();
            expect(stream.la(0)).to.eql('e');
        });

        it('should return the current character', () => {
            var stream = new CharStream('hello');
            expect(stream.next()).to.eql('h');
            expect(stream.next()).to.eql('e');
            expect(stream.next()).to.eql('l');
            expect(stream.next()).to.eql('l');
            expect(stream.next()).to.eql('o');
            expect(stream.next()).to.equal(EOF);
        });

        it('should update the line info', () => {
            var stream = new CharStream(`hello
            world`);
            expect(stream.match('hello')).to.be.true;
            stream.next();
            expect(stream.mark()).to.eql({ line: 2, column: 0, index: 6 });
        });
    });

    describe('#mark', () => {
        it('should rewind to the marked position', () => {
            var stream = new CharStream('hello'),
                start = stream.mark();
            expect(stream.next()).to.eql('h');
            expect(stream.next()).to.eql('e');
            expect(stream.next()).to.eql('l');
            expect(stream.next()).to.eql('l');
            expect(stream.next()).to.eql('o');
            stream.rewind(start);
            expect(stream.next()).to.eql('h');
        });
    });

    describe('#match', () => {
        it('should match a string', () => {
            var stream = new CharStream('hello');
            expect(stream.match('he')).to.be.true;
            expect(stream.match('llo')).to.be.true;
        });

        it('should fail if no match', () => {
            var stream = new CharStream('hello');
            expect(stream.match('hello world')).to.be.false;
            expect(stream.match('hello')).to.be.true;
        });
    });
});
