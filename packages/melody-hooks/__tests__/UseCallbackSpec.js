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
import { createComponent, useState, useCallback } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('useCallback', () => {
    describe('without inputs being specified', () => {
        it('should return the passed callback on every update', () => {
            const root = document.createElement('div');
            const callbacks = [];
            let setter;
            const MyComponent = createComponent(() => {
                const [value, setValue] = useState(false);
                setter = setValue;
                const callback = useCallback(() => {});
                callbacks.push(callback);
                return { value };
            }, template);
            render(root, MyComponent);
            setter(true);
            flush();
            setter(false);
            flush();
            expect(callbacks[0] !== callbacks[1]).toBeTruthy();
            expect(callbacks[1] !== callbacks[2]).toBeTruthy();
        });
    });
    describe('with inputs being specified', () => {
        it('should return an updated callback when inputs change', () => {
            const root = document.createElement('div');
            const callbacks = [];
            let setter;
            let setter2;
            const MyComponent = createComponent(() => {
                const [value, setValue] = useState(false);
                const [, setValue2] = useState(false);
                setter = setValue;
                setter2 = setValue2;
                const callback = useCallback(() => {}, [value]);
                callbacks.push(callback);
                return { value };
            }, template);
            render(root, MyComponent);
            setter2(true);
            flush();
            setter(true);
            flush();
            expect(callbacks[0] === callbacks[1]).toBeTruthy();
            expect(callbacks[1] !== callbacks[2]).toBeTruthy();
        });
        it('should return the same callback when inputs are empty', () => {
            const root = document.createElement('div');
            const callbacks = [];
            let setter;
            let setter2;
            const MyComponent = createComponent(() => {
                const [value, setValue] = useState(false);
                const [, setValue2] = useState(false);
                setter = setValue;
                setter2 = setValue2;
                const callback = useCallback(() => {}, []);
                callbacks.push(callback);
                return { value };
            }, template);
            render(root, MyComponent);
            setter2(true);
            flush();
            setter(true);
            flush();
            expect(callbacks[0] === callbacks[1]).toBeTruthy();
            expect(callbacks[1] === callbacks[2]).toBeTruthy();
        });
    });
});
