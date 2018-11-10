/**
 * Copyright 2018 trivago N.V.
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
import { assert } from 'chai';

import { render } from 'melody-component';
import { elementOpen, elementClose, text } from 'melody-idom';
import { createComponent, useState, usePrevious } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('usePrevious', () => {
    it('should return the previous value', () => {
        const root = document.createElement('div');
        let setter;
        const MyComponent = createComponent(template, () => {
            const [value, setValue] = useState(0);
            setter = setValue;
            const prev = usePrevious(value);
            return { value: JSON.stringify({ value, prev }) };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>{"value":0}</div>');
        setter(2);
        flush();
        assert.equal(root.outerHTML, '<div>{"value":2,"prev":0}</div>');
        setter(1337);
        flush();
        assert.equal(root.outerHTML, '<div>{"value":1337,"prev":2}</div>');
    });
});
