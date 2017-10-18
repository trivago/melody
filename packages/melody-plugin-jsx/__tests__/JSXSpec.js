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
import { compile, toString } from 'melody-compiler';
import { extension as coreExtension } from 'melody-extension-core';
import jsxPlugin from '../src';
import { stripIndent } from 'common-tags';

function getOutput(code) {
    return toString(compile('test.twig', code, coreExtension, jsxPlugin), code)
        .code;
}

describe('JSX', function() {
    it('should remove attributes filters', function() {
        const code = stripIndent`
      <div
        {{ {
          class: 'my-class',
          id: 'my-id'
        } | attrs }}/>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should support object expression', function() {
        const code = stripIndent`
      <div
        {{ {
          class: 'my-class',
          id: 'my-id'
        } }}/>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should spread identifiers', function() {
        const code = stripIndent`
      <div {{ attributes }}/>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should transform string literals', function() {
        const code = stripIndent`
      <div {{ 'checked' }} disabled/>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should transform attributes to jsx naming conventions', function() {
        const code = stripIndent`
      <div
        class="foo"
        data-foo="foo"
        tabindex="1"
        for="foo"
        onclick="{{ handler }}"/>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should hoist attributes that will get mutated', function() {
        const code = stripIndent`
      {% set foo = 'bar' %}
      <div class="{{ foo }}">
          {% set foo = 'qux' %}
          <p class="{{ foo }}" title="{{ foo }}">Hello World</p>
      </div>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should hoist optimized attributes that will get mutated', function() {
        const code = stripIndent`
      {% set foo = 'bar' %}
      <div {{ {
        class: foo
      } | attrs }}>
          {% set foo = 'qux' %}
          <p {{ {
            class: foo,
            title: foo
          } | attrs }}>Hello World</p>
      </div>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should work with loops', function() {
        const code = stripIndent`
      <ul>
          {% for item in items %}
            {% set className = 'li-' ~ id %}
            <li key="{{ item.id }}" class="{{ className }}">
              {% set className = 'span-' ~ id %}
              <span class="{{ className }}">{{ item.label }}</span>
            </li>
          {% endfor %}
      </ul>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should work with loops and multiple roots', function() {
        const code = stripIndent`
      <ul>
          {% for item in items %}
              <li class="{{ loop.last ? 'last' : '' }}">
                <p>Hello World</p>
              </li>
              <li>Hotel? Trivago!</li>
              {% if foo %}
                <li class="foo">Foo you!</li>
              {% endif %}
          {% endfor %}
      </ul>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
    it('should work with complex conditions', function() {
        const code = stripIndent`
      {% set foo = 'bar' %}
      <div class="{{ foo }}">
          {% set foo = 'qux' %}
          <p class="{{ foo }}" title="{{ foo }}">Hello World</p>
          {% if bar == 'foo' %}
            {% set foo = 'nom' %}
            <div class="{{ foo }}">Hello</div>
          {% elseif bar == 'nom' %}
            <section class="{{ bar }}">Hello</section>
            {% if qux == 'nom' %}
              <span>Qux</span>
            {% endif %}
          {% else %}
            <p>Look at this {{ bar }}</p>
          {% endif %}
      </div>
    `;
        expect(getOutput(code)).toMatchSnapshot();
    });
});
