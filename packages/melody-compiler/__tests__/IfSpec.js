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

import { parse, getNodeSource } from 'melody-parser';
import { extension } from 'melody-extension-core';

describe('if', function() {
    test('should parse simple if-endif', function() {
        const node = parse(
            `{% if test -%}
                Dog
            {%- endif %}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });

    test('should parse simple if-else-endif', function() {
        const node = parse(
            `{% if foo %}
            Foo
        {%- else -%}
            Bar
        {% endif %}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });

    test('should parse if-elseif-elseif-endif', function() {
        const node = parse(
            `{% if dog -%}
            Dog
        {%- elseif cat -%}
            Cat
        {%- elseif bird -%}
            Bird
        {%- else %}
            Other
        {%- endif -%}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });

    test('should be able to reproduce the original source', function() {
        const ifStatementSource = `{% if foo %}
        Foo
    {%- else -%}
        Bar
    {% endif %}`;
        const source = `The winner is: ${ifStatementSource}`;
        const node = parse(source, extension);
        expect(getNodeSource(node.expressions[1], source)).toEqual(
            ifStatementSource
        );
    });
});
