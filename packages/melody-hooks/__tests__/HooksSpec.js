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
import { render } from 'melody-component';
import { elementOpen, elementClose, text } from 'melody-idom';
import { createComponent, useState, useEffect } from '../src';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('hooks', () => {
    it('should throw when calling hooks outside of a component functions', () => {
        const error = new Error(
            'Cannot use hooks outside of component functions'
        );
        expect(() => {
            useState(0);
        }).toThrow(error);
    });
    it('should throw when hook slots differ', () => {
        const root = document.createElement('div');
        let setter;
        const MyComponent = createComponent(() => {
            const [value, setValue] = useState(0);
            setter = setValue;
            if (value === 1) {
                useState(0);
            } else {
                useEffect(() => {});
            }
        }, template);
        render(root, MyComponent);
        const error = new Error(
            'The order of hooks changed. This breaks the internals of the component. It is not allowed to call hooks inside loops, conditions, or nested functions'
        );
        expect(() => {
            setter(1);
        }).toThrow(error);
    });
});
