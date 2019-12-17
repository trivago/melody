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

describe('mount', function() {
    test('should parse a simple mount tag', function() {
        const node = parse(
            `{%- mount './component' as 'bar' -%}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });

    test('should parse a mount...async tag', function() {
        const node = parse(
            `{% mount async 'template.twig' with {foo: 'bar'} delay placeholder by 1s -%}
            Loading...
          {%- catch err -%}
            Failed to load with {{ err }}
          {%- endmount %}`,
            { applyWhitespaceTrimming: false },
            extension
        );
        expect(node.expressions[0]).toMatchSnapshot();
    });
});
