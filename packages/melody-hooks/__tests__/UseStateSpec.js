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
import { createComponent, useState, useEffect } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('useState', () => {
    it('should read initial value from a useState hook', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(template, () => {
            const [value] = useState('foo');
            return { value };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foo</div>');
    });
    it('should read multiple initial values from useState hooks', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(template, () => {
            const [foo] = useState('foo');
            const [bar] = useState('bar');
            return { value: foo + bar };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foobar</div>');
    });
    it('should update when state is changed', () => {
        const root = document.createElement('div');
        let setter;
        const MyComponent = createComponent(template, () => {
            const [foo, setFoo] = useState('foo');
            const [bar] = useState('bar');
            setter = setFoo;
            return { value: foo + bar };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foobar</div>');
        setter('bar');
        flush();
        assert.equal(root.outerHTML, '<div>barbar</div>');
    });
    it('should update when state is changed 2', () => {
        const root = document.createElement('div');
        let setter;
        const MyComponent = createComponent(template, () => {
            const [foo] = useState('foo');
            const [bar, setBar] = useState('bar');
            setter = setBar;
            return { value: foo + bar };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foobar</div>');
        setter('foo');
        flush();
        assert.equal(root.outerHTML, '<div>foofoo</div>');
    });
    it('should be possible to pass a function to set the state', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(template, () => {
            called++;
            const [state, setState] = useState({ counter: 1, foo: 'bar' });
            useEffect(() => {
                setState(state => ({
                    ...state,
                    counter: state.counter + 1,
                }));
            });
            return { value: JSON.stringify(state) };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>{"counter":1,"foo":"bar"}</div>');
        flush();
        assert.equal(root.outerHTML, '<div>{"counter":2,"foo":"bar"}</div>');
        assert.equal(called, 2);
    });
    it('should have the correct value when called subsequently', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(template, () => {
            called++;
            const [value, setValue] = useState(0);
            useEffect(() => {
                setValue(value => value + 1);
                setValue(value => value + 1);
            });
            return { value };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>0</div>');
        flush();
        assert.equal(root.outerHTML, '<div>2</div>');
        assert.equal(called, 2);
    });
    it('should have the correct value when called subsequently 2', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(template, () => {
            called++;
            const [value, setValue] = useState(0);
            useEffect(() => {
                setValue(value => undefined);
                setValue(value => value + 1);
            });
            return { value };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>0</div>');
        flush();
        assert.equal(root.outerHTML, '<div>NaN</div>');
        assert.equal(called, 2);
    });
    it('should be possible to pass a function as initialState', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(template, () => {
            const [value] = useState(() => 'foo');
            return { value };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foo</div>');
    });
    it('should update from an effect', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(template, () => {
            called++;
            const [foo, setFoo] = useState('foo');
            useEffect(() => {
                setFoo('bar');
            });
            return { value: foo };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foo</div>');
        flush();
        assert.equal(root.outerHTML, '<div>bar</div>');
        assert.equal(called, 2);
    });
    it('should only update once from an effect', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(template, () => {
            called++;
            const [foo, setFoo] = useState('foo');
            const [bar, setBar] = useState('bar');
            useEffect(() => {
                setFoo('bar');
                setBar('foo');
            });
            return { value: foo + bar };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foobar</div>');
        flush();
        assert.equal(root.outerHTML, '<div>barfoo</div>');
        assert.equal(called, 2);
    });
    it('should apply setState calls from the component function without rerendering', () => {
        const root = document.createElement('div');
        let called = 0;
        const values = [];
        const MyComponent = createComponent(template, () => {
            called++;
            const [foo, setFoo] = useState('foo');
            const [bar, setBar] = useState('bar');
            values.push(foo, bar);
            setFoo('foo1');
            setFoo('foo2');
            setBar('bar1');
            setBar('bar2');
            return { value: foo + bar };
        });
        render(root, MyComponent);
        assert.equal(root.outerHTML, '<div>foo2bar2</div>');
        assert.equal(called, 2);
        assert.deepEqual(values, ['foo', 'bar', 'foo2', 'bar2']);
    });
    it('should throw when component function leads to an infinite loop', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(template, () => {
            const [value, setValue] = useState(0);
            setValue(value + 1);
            return { value };
        });

        assert.throws(() => {
            render(root, MyComponent);
        }, 'Too many re-renders. Melody limits the number of renders to prevent an infinite loop.');
    });
});
