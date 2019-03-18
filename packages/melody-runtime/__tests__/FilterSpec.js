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
    batch,
    attrs,
    styles,
    classes,
    merge,
    replace,
    reverse,
    round,
    title,
    url_encode,
    striptags,
    number_format,
    format,
    strtotime,
    trim,
} from '../src';

describe('Twig filter runtime', function() {
    describe('batch filter', function() {
        it('should group items', function() {
            const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
            const expected = [
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'h', 'i'],
            ];
            const actual = batch(items, 3, 'No Item');
            expect(actual).toEqual(expected);
        });

        it('should insert missing if needed', function() {
            const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
            const expected = [
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'No Item', 'No Item'],
            ];
            const actual = batch(items, 3, 'No Item');
            expect(actual).toEqual(expected);
        });
    });

    describe('attrs filter', function() {
        it('should convert map to array', function() {
            const input = { a: 'b', c: false };
            const expected = ['a', 'b', 'c', undefined];
            const actual = attrs(input);
            expect(actual).toEqual(expected);
        });

        it('should keep falsy values that are not false', function() {
            const input = { a: 'b', c: 0, d: '', e: false };
            const expected = [
                'a',
                'b',
                'c',
                undefined,
                'd',
                undefined,
                'e',
                undefined,
            ];
            const actual = attrs(input);
            expect(actual).toEqual(expected);
        });

        it('should ignore inherited properties', function() {
            const input = Object.create({ a: 2 });
            input.b = 1;
            const expected = ['b', 1];
            const actual = attrs(input);
            expect(actual).toEqual(expected);
        });
    });

    describe('styles filter', function() {
        it('should convert object to string', function() {
            const input = { declaration: 'value' };
            const expected = 'declaration:value;';
            const actual = styles(input);
            expect(actual).toEqual(expected);
        });

        it('should obey conditions for adding other styles', function() {
            const input = {
                color: 'red',
                'background-image': '',
                'background-repeat': false,
                'background-attachment': undefined,
                'background-position': null,
                'background-color': 'blue',
                border: {},
                font: [],
                left: 0,
                right: NaN,
            };
            const expected = 'color:red;background-color:blue;left:0;';
            const actual = styles(input);
            expect(actual).toEqual(expected);
        });
    });

    describe('classes filter', function() {
        it('should convert object to string', function() {
            const input = { class1: true };
            const expected = 'class1';
            const actual = classes(input);
            expect(actual).toEqual(expected);
        });

        it('should add base class', function() {
            const input = { base: 'base-class' };
            const expected = 'base-class';
            const actual = classes(input);
            expect(actual).toEqual(expected);
        });

        it('should add multiple base classes', function() {
            const input = { base: 'base-class base-class1 base-class2' };
            const expected = 'base-class base-class1 base-class2';
            const actual = classes(input);
            expect(actual).toEqual(expected);
        });

        it('should add base class and conditional class', function() {
            const input = { base: 'base-class', class1: true };
            const expected = 'base-class class1';
            const actual = classes(input);
            expect(actual).toEqual(expected);
        });

        it('should add base class and obey conditions for adding other classes', function() {
            const input = { base: 'base-class', class1: true, class2: false };
            const expected = 'base-class class1';
            const actual = classes(input);
            expect(actual).toEqual(expected);
        });

        it('should obey conditions for adding other classes', function() {
            const input = { class1: true, class2: false };
            const expected = 'class1';
            const actual = classes(input);
            expect(actual).toEqual(expected);
        });

        it('should add multiple base classes and obey conditions for adding other classes', function() {
            const input = {
                base: 'base-class base-class1',
                class1: true,
                class2: false,
            };
            const expected = 'base-class base-class1 class1';
            const actual = classes(input);
            expect(actual).toEqual(expected);
        });
    });

    describe('merge filter', function() {
        it('should merge objects', function() {
            const inputA = { a: 1 };
            const inputB = { b: 2 };
            const expected = { a: 1, b: 2 };
            const actual = merge(inputA, inputB);
            expect(actual).toEqual(expected);
        });

        it('should not mutate its arguments', function() {
            const inputA = { a: 1 };
            const inputB = { b: 2 };
            merge(inputA, inputB);
            expect(inputA).toEqual({ a: 1 });
            expect(inputA.b).toBeUndefined();
            expect(inputB).toEqual({ b: 2 });
        });

        it('should merge arrays', function() {
            const inputA = [1, 2];
            const inputB = [3, 4];
            const expected = [1, 2, 3, 4];
            const actual = merge(inputA, inputB);
            expect(actual).toEqual(expected);
        });
    });

    describe('replace filter', function() {
        it('should replace values within a string', function() {
            const input = 'hello world!';
            const expected = 'hello universe!';
            const actual = replace(input, {
                world: 'universe',
            });
            expect(actual).toEqual(expected);
        });
    });

    describe('reverse filter', function() {
        it('should reverse array elements', function() {
            const input = [1, 2, 3, 4];
            const expected = [4, 3, 2, 1];
            const actual = reverse(input);
            expect(actual).toEqual(expected);
        });

        it('should reverse a string', function() {
            const input = '1234';
            const expected = '4321';
            const actual = reverse(input);
            expect(actual).toEqual(expected);
        });

        it('should not reverse an object', function() {
            const input = { a: 1, b: 2 };
            const actual = reverse(input);
            expect(actual).toEqual(input);
        });
    });

    describe('round filter', function() {
        it('should ceil the number to the given precision', function() {
            const input = 0.8241331;
            const expected = 0.9;
            const actual = round(input, 1, 'ceil');
            expect(actual).toEqual(expected);
        });

        it('should floor the number to the given precision', function() {
            const input = 0.8241331;
            const expected = 0.8;
            const actual = round(input, 1, 'floor');
            expect(actual).toEqual(expected);
        });

        it('should round the number', function() {
            const input = 0.8241331;
            const expected = 1;
            const actual = round(input, 0, 'common');
            expect(actual).toEqual(expected);
        });

        it('should use 0 precision as default', function() {
            const input = 0.8241331;
            const expected = 1;
            const actual = round(input);
            expect(actual).toEqual(expected);
        });
    });

    describe('title filter', function() {
        it('should title case the first letter of all words', function() {
            const input = 'hello world is fun!';
            const expected = 'Hello World Is Fun!';
            const actual = title(input);
            expect(actual).toEqual(expected);
        });
    });

    describe('url_encode filter', function() {
        it('should encode a string', function() {
            const input = 'foo=hello world';
            const expected = 'foo%3Dhello%20world';
            const actual = url_encode(input);
            expect(actual).toEqual(expected);
        });

        it('should encode an object', function() {
            const input = { foo: 'hello world', 'foo bar': 2 };
            const expected = 'foo=hello%20world&foo%20bar=2';
            const actual = url_encode(input);
            expect(actual).toEqual(expected);
        });
    });

    describe('striptags filter', function() {
        it('should remove HTML tags', function() {
            const input = '<div class="foo">test</div>';
            const expected = 'test';
            const actual = striptags(input);
            expect(actual).toEqual(expected);
        });
    });

    describe('number_format filter', function() {
        it('should format a number', function() {
            expect(number_format(455121.213, 2, ',', '.')).toEqual(
                '455.121,21'
            );
        });

        it('should use US as default local', function() {
            expect(number_format(455121.213, 1)).toEqual('455,121.2');
        });

        it('should extend the number to the precision if needed', function() {
            expect(number_format(455121, 1)).toEqual('455,121.0');
            expect(number_format(455121.01, 5)).toEqual('455,121.01000');
        });

        it('should default to 0 precision', function() {
            expect(number_format(455121.213)).toEqual('455,121');
        });

        it('should return 0 on invalid input', function() {
            expect(number_format('hello', 1)).toEqual('0.0');
        });
    });

    describe('format filter', function() {
        it('should insert strings', function() {
            expect(format('Hello %s!', 'world')).toEqual('Hello world!');
        });

        it('should format numbers', function() {
            expect(format('%01.2f', 123.1)).toEqual('123.10');
            expect(format('%d', 123456789012345)).toEqual('123456789012345');

            const n = 43951789;
            const u = -n;
            const c = 65;

            expect(format("%%b = '%b'", n)).toEqual(
                "%b = '10100111101010011010101101'"
            );
            expect(format("%%c = '%c'", c)).toEqual("%c = 'A'");
            expect(format("%%d = '%d'", c)).toEqual("%d = '65'");
            expect(format("%%i = '%i'", c)).toEqual("%i = '65'");
            expect(format("%%i = '%i'", '')).toEqual("%i = '0'");
            expect(format("%%e = '%e'", n)).toEqual("%e = '4.395179e+7'");
            expect(format("%%u = '%u'", n)).toEqual("%u = '43951789'");
            expect(format("%%u = '%u'", u)).toEqual("%u = '4251015507'");
            expect(format("%%f = '%f'", n)).toEqual("%f = '43951789.000000'");
            expect(format("%%f = '%f'", u)).toEqual("%f = '-43951789.000000'");
            expect(format("%%F = '%F'", n)).toEqual("%F = '43951789.000000'");
            expect(format("%%g = '%g'", n)).toEqual("%g = '43951789'");
            expect(format("%%G = '%G'", n)).toEqual("%G = '43951789'");
            expect(format("%%f = '%.2f'", n)).toEqual("%f = '43951789.00'");
            expect(format("%%f = '%.*f'", 1, n)).toEqual("%f = '43951789.0'");
            expect(format("%%o = '%o'", n)).toEqual("%o = '247523255'");
            expect(format("%%s = '%s'", n)).toEqual("%s = '43951789'");
            expect(format("%%x = '%x'", n)).toEqual("%x = '29ea6ad'");
            expect(format("%%X = '%X'", n)).toEqual("%X = '29EA6AD'");
            expect(format("%%+d = '%+d'", n)).toEqual("%+d = '+43951789'");
            expect(format("%%+d = '% d'", n)).toEqual("%+d = ' 43951789'");
            expect(format("%%+d = '%+d'", u)).toEqual("%+d = '-43951789'");

            expect(() => format("%%f = '%*.*f'", 1, n)).toThrowError(
                /toFixed\(\) digits argument must be between 0 and (20|100)/
            );
        });

        it('should add padding', function() {
            expect(format('[%10s]', 'monkey')).toEqual('[    monkey]');
            expect(format('[%*s]', 10, 'monkey')).toEqual('[    monkey]');
            expect(format('[%*s]', -10, 'monkey')).toEqual('[monkey    ]');
            expect(format('[%-10s]', 'monkey')).toEqual('[monkey    ]');
            expect(format('[%10.10s]', 'many monkeys')).toEqual('[many monke]');
            expect(format("[%'#10s]", 'monkey')).toEqual('[####monkey]');
            expect(format('%-03s', 'E')).toEqual('E00');

            expect(() => format('[%*s]', 'fun', 'monkey')).toThrowError(
                new Error('sprintf: (minimum-)width must be finite')
            );
        });

        it('should swap arguments', function() {
            expect(format('%2$s %1$s!', 'world', 'Hello')).toEqual(
                'Hello world!'
            );
            expect(
                format('The %2$s contains %1$04d monkeys', 12000, 'zoo')
            ).toEqual('The zoo contains 12000 monkeys');
            expect(
                format('The %2$s contains %1$04d monkeys', 120, 'zoo')
            ).toEqual('The zoo contains 0120 monkeys');
        });

        it('should ignore invalid options', function() {
            expect(format('Hello %a!', 'world')).toEqual('Hello %a!');
        });
    });

    describe('strtotime filter', function() {
        const now = 1129633200;
        const time = new Date();
        time.setHours(12);
        time.setMinutes(6);
        time.setSeconds(45);
        const unixTime = Math.floor(time.getTime() / 1000);
        it('should convert relative timestamps', function() {
            expect(strtotime('+1 day', now)).toEqual(1129719600);
            expect(strtotime('+1 week 2 days 4 hours 2 seconds', now)).toEqual(
                1130425202
            );
            expect(
                strtotime('+1 day 1 week 2 days 4 hours 2 seconds', now)
            ).toEqual(1130511602);
            expect(strtotime('last month', now)).toEqual(1127041200);
            expect(strtotime('next Thursday', now)).toEqual(1129806000);
            expect(strtotime('last Monday', now)).toEqual(1129546800);
            expect(strtotime('now', now)).toEqual(now);

            expect(strtotime('12.06.45', now)).toEqual(unixTime);
            expect(strtotime('12:06:45', now)).toEqual(unixTime);
        });

        it('should convert dates after 2000', function() {
            expect(strtotime('10 September 09')).toEqual(1252537200);
            expect(strtotime('10 September 2009')).toEqual(1252537200);
            expect(strtotime('2009-09-10', now)).toEqual(1252537200);
            expect(strtotime('2009/09/10', now)).toEqual(1252537200);
            expect(strtotime('10-09-2009', now)).toEqual(1252537200);
            expect(strtotime('10.09.2009', now)).toEqual(1252537200);
            expect(strtotime('09/10/2009', now)).toEqual(1252537200);
            expect(strtotime('09-09-10', now)).toEqual(1252537200);
            expect(strtotime('09/10/09', now)).toEqual(1252537200);
        });

        it('should convert dates before 2000', function() {
            expect(strtotime('10 September 79', now)).toEqual(305766000);
            expect(strtotime('10 September 1979', now)).toEqual(305766000);
            expect(strtotime('1979-09-10', now)).toEqual(305766000);
            expect(strtotime('1979/09/10', now)).toEqual(305766000);
            expect(strtotime('10-09-1979', now)).toEqual(305766000);
            expect(strtotime('10.09.1979', now)).toEqual(305766000);
            expect(strtotime('09/10/1979', now)).toEqual(305766000);
            expect(strtotime('79-09-10', now)).toEqual(305766000);
            expect(strtotime('10.09.79', now)).toEqual(305766000);
            expect(strtotime('09/10/79', now)).toEqual(305766000);
        });

        it('should convert timestamps', function() {
            expect(strtotime('2009-05-04 08:30:00 GMT')).toEqual(1241425800);
            expect(strtotime('2009-05-04 08:30:00+00')).toEqual(1241425800);
            expect(strtotime('2009-05-04 08:30:00+02:00')).toEqual(1241418600);
            expect(strtotime('2009-05-04 08:30:00z')).toEqual(1241425800);
        });

        it('should return false when given an empty string', function() {
            expect(strtotime('')).toBeFalsy();
        });

        it('should return false when given invalid input', function() {
            expect(strtotime('1801/09/10', now)).toBeFalsy();
            expect(strtotime('1979-13-10', now)).toBeFalsy();
            expect(strtotime('1979/13/10', now)).toBeFalsy();
        });
    });

    describe('trim filter', function() {
        it('should fallback to native trim', function() {
            expect(trim('  melody  ')).toEqual('melody');
        });

        it('should correctly trim one character', function() {
            expect(trim('--melody--', '-', 'left')).toEqual('melody--');
            expect(trim('--melody--', '-', 'right')).toEqual('--melody');
            expect(trim('--melody--', '-', 'both')).toEqual('melody');
            expect(trim('--mel--ody--', '-', 'both')).toEqual('mel--ody');
        });

        it('should correctly trim multiple characters', function() {
            expect(trim('(()melody())', '()', 'left')).toEqual('melody())');
            expect(trim('(()melody())', '()', 'right')).toEqual('(()melody');
            expect(trim('(()melody())', '()', 'both')).toEqual('melody');
            expect(trim('(()me(l)ody())', '()', 'both')).toEqual('me(l)ody');
        });

        it('should not change the source string if not needed', function() {
            expect(trim('(()melody())', '-my', 'both')).toEqual('(()melody())');
        });

        it('should work with empty strings', function() {
            expect(trim('', '-', 'both')).toEqual('');
            expect(trim('', '-', 'left')).toEqual('');
            expect(trim('', '-', 'right')).toEqual('');
            expect(trim('  melody  ', '', 'both')).toEqual('  melody  ');
        });

        it('should return an empty string if every character is removed', function() {
            expect(trim('----', '-', 'both')).toEqual('');
            expect(trim('----', '-', 'left')).toEqual('');
            expect(trim('----', '-', 'right')).toEqual('');
        });

        it('should error if side is not valid', function() {
            const error =
                'Filter "trim". Invalid value foobar for parameter "side". Valid values are "both", "left", "right".';
            expect(() => trim('----', '-', 'foobar')).toThrowError(
                new Error(error)
            );
        });
    });
});
