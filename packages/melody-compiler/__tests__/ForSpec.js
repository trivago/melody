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

describe('for', function() {
    test('should parse a normal for loop', function() {
        const node = parse(
            `{% for item in items -%}
            <li class="{{ loop.last ? 'last' : '' }}">
                {{ loop.index }}
            </li>
        {%- endfor %}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });

    test('should parse a for-if-else loop', function() {
        const node = parse(
            `{% for a,b in c | slice(3, c.length) if b is even %}
            <li>{{ a }} - {{ b }}</li>
        {%- else -%}
            <li>No results found</li>
        {% endfor %}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });
});
