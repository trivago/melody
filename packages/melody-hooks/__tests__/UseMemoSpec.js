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
import { createComponent, useState, useMemo } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('useMemo', () => {
    it('should memoize the value', () => {
        const root = document.createElement('div');
        const values = [];
        let setter;
        const MyComponent = createComponent(template, () => {
            const [value, setValue] = useState(false);
            setter = setValue;

            // always return a new array from getter
            const memoized = useMemo(() => []);
            values.push(memoized);

            return { value };
        });
        render(root, MyComponent);
        setter(true);
        flush();
        setter(false);
        flush();
        assert.equal(values[0] === values[1] && values[1] === values[2], true);
    });
    it('should update the value when inputs change', () => {
        const root = document.createElement('div');
        const values = [];
        let setter;
        const MyComponent = createComponent(template, () => {
            const [value, setValue] = useState(false);
            setter = setValue;

            // always return a new array from getter
            const memoized = useMemo(() => [], [value]);
            values.push(memoized);

            return { value };
        });
        render(root, MyComponent);
        setter(true);
        flush();
        setter(false);
        flush();
        assert.equal(
            values[0] !== values[1] &&
                values[1] !== values[2] &&
                values[2] !== values[0],
            true
        );
    });
});
