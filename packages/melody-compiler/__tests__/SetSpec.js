/**
 * Copyright 2019 trivago N.V.
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
import { extension } from 'melody-extension-core';

describe('set', function() {
    test('should parse set...endset', function() {
        const node = parse(
            `{% set foo -%}
            <p>Some more text</p>
        {%- endset %}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });

    test('should parse a simple set statement', function() {
        const node = parse(
            `{%- set foo = 0 -%}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });

    test('should preserve the original source when desired', function() {
        const source = `{% set foo = 0 %}`;
        const node = parse(source, { source }, extension);
        expect(node.expressions[0].originalSource).toEqual(source);
    });
});
