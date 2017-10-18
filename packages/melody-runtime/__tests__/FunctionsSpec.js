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

import { random, min, max, cycle, attribute } from '../src/functions';

describe('Twig function runtime', function() {
    describe('random', function() {
        it('should accept an upper bound', function() {
            const input = 0;
            const expected = 0;
            const actual = random(input);
            expect(actual).to.eql(expected);
        });

        it('should select an element from an array', function() {
            const input = ['a', 'b'];
            const actual = random(input);
            expect(actual).to.be.oneOf(input);
        });
    });

    describe('min', function() {
        it('should accept varargs', function() {
            const actual = min(1, 2, 3, 4, 5, 6, 7);
            expect(actual).to.equal(1);
        });

        it('should accept an array', function() {
            const input = [1, 2, 3, 4, 5, 6, 7];
            const actual = min(input);
            expect(actual).to.equal(1);
        });

        it('should select the lowest value in an object', function() {
            const input = { a: 1, b: 2 };
            const actual = min(input);
            expect(actual).to.equal(1);
        });
    });

    describe('max', function() {
        it('should accept varargs', function() {
            const actual = max(1, 2, 3, 4, 5, 6, 7);
            expect(actual).to.equal(7);
        });

        it('should accept an array', function() {
            const input = [1, 2, 3, 4, 5, 6, 7];
            const actual = max(input);
            expect(actual).to.equal(7);
        });

        it('should select the lowest value in an object', function() {
            const input = { a: 1, b: 2 };
            const actual = max(input);
            expect(actual).to.equal(2);
        });
    });

    describe('cycle', function() {
        it('should return the element at the given index', function() {
            const input = ['a', 'b', 'c'];
            expect(cycle(input, 0)).to.equal('a');
            expect(cycle(input, 1)).to.equal('b');
            expect(cycle(input, 2)).to.equal('c');
            expect(cycle(input, 3)).to.equal('a');
            expect(cycle(input, 4)).to.equal('b');
            expect(cycle(input, 5)).to.equal('c');
            expect(cycle(input, 6)).to.equal('a');
        });
    });

    describe('attribute', function() {
        it('should return an array index', function() {
            expect(attribute(['a', 'b', 'c'], 1)).to.equal('b');
        });

        it('should return the value of a property', function() {
            const input = { a: 42 };
            expect(attribute(input, 'a')).to.equal(42);
        });

        it('should evaluate a function, forwarding the arguments', function() {
            const input = {
                a(b, c) {
                    return b + c;
                },
            };
            expect(attribute(input, 'a', [2, 3])).to.equal(5);
        });

        it('should use a getter if available', function() {
            const input = {
                getAValue() {
                    return 5;
                },
            };
            expect(attribute(input, 'aValue')).to.equal(5);
        });

        it('should use an is property if available', function() {
            const input = {
                isAValue() {
                    return true;
                },
            };
            expect(attribute(input, 'aValue')).to.equal(true);
        });

        it('should return undefined on mismatch', function() {
            const input = {};
            expect(attribute(input, 'toString')).to.equal(undefined);
        });
    });
});
