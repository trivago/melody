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

import { parse } from 'melody-parser';

describe('String literal', function() {
    describe('when parsed', function() {
        test('should preserve backslashes', function() {
            const node = parse(`{{ 'zzz\\bar\\baz' }}`);
            expect(node.expressions[0]).toMatchSnapshot();
        });

        test('should respect "preserveSourceLiterally"', function() {
            const string = `zzz\\'b"ar`;
            const input = `{{ '${string}' }}`;
            const node = parse(input, {
                preserveSourceLiterally: true,
            });
            expect(node.expressions[0].value.value).toEqual(string);
        });
    });
});
