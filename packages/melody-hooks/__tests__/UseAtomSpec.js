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
import { createComponent, useAtom, useEffect } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('useAtom', () => {
    it('should read initial value from a useState hook', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(() => {
            const [value] = useAtom('foo');
            return { value: value() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foo</div>');
    });
    it('should read multiple initial values from useState hooks', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(() => {
            const [foo] = useAtom('foo');
            const [bar] = useAtom('bar');
            return { value: foo() + bar() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foobar</div>');
    });
    it('should update when state is changed', () => {
        const root = document.createElement('div');
        let setter;
        const MyComponent = createComponent(() => {
            const [getFoo, setFoo, foo] = useAtom('foo');
            const [getBar, setBar, bar] = useAtom('bar');
            setter = setFoo;
            return { value: foo + bar };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foobar</div>');
        setter('bar');
        flush();
        expect(root.outerHTML).toEqual('<div>barbar</div>');
    });
    it('should update when state is changed 2', () => {
        const root = document.createElement('div');
        let setter;
        const MyComponent = createComponent(() => {
            const [getFoo] = useAtom('foo');
            const [getBar, setBar] = useAtom('bar');
            setter = setBar;
            return { value: getFoo() + getBar() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foobar</div>');
        setter('foo');
        flush();
        expect(root.outerHTML).toEqual('<div>foofoo</div>');
    });
    it("should not update when state hasn't changed", () => {
        const root = document.createElement('div');
        let setter;
        let called = 0;
        const MyComponent = createComponent(() => {
            called++;
            const [getFoo, setFoo, foo] = useAtom({ foo: 'bar', bar: 'foo' });
            setter = setFoo;
            return { value: foo };
        }, template);
        render(root, MyComponent);
        setter({ bar: 'foo', foo: 'bar' });
        flush();
        expect(called).toEqual(1);
    });
    it('should be possible to pass a function to set the state', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(() => {
            called++;
            const [getState, setState] = useAtom({ counter: 1, foo: 'bar' });
            useEffect(() => {
                setState(state => ({
                    ...state,
                    counter: getState().counter + 1,
                }));
            }, []);
            return { value: JSON.stringify(getState()) };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>{"counter":1,"foo":"bar"}</div>');
        flush();
        expect(root.outerHTML).toEqual('<div>{"counter":2,"foo":"bar"}</div>');
        expect(called).toEqual(2);
    });
    it('should have the correct value when called subsequently', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(() => {
            called++;
            const [getValue, setValue] = useAtom(0);
            useEffect(() => {
                setValue(value => value + 1);
                setValue(value => value + 1);
            }, []);
            return { value: getValue() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>0</div>');
        flush();
        expect(root.outerHTML).toEqual('<div>2</div>');
        expect(called).toEqual(2);
    });
    it('should have the correct value when called subsequently 2', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(() => {
            called++;
            const [value, setValue] = useAtom(0);
            useEffect(() => {
                setValue(value => undefined);
                setValue(value => value + 1);
            }, []);
            return { value: value() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>0</div>');
        flush();
        expect(root.outerHTML).toEqual('<div>NaN</div>');
        expect(called).toEqual(2);
    });
    it('should be possible to pass a function as initialState', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(() => {
            const [value] = useAtom(() => 'foo');
            return { value: value() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foo</div>');
    });
    it('should update from an effect', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(() => {
            called++;
            const [foo, setFoo] = useAtom('foo');
            useEffect(() => {
                setFoo('bar');
            }, []);
            return { value: foo() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foo</div>');
        flush();
        expect(root.outerHTML).toEqual('<div>bar</div>');
        expect(called).toEqual(2);
    });
    it('should only update once from an effect', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(() => {
            called++;
            const [foo, setFoo] = useAtom('foo');
            const [bar, setBar] = useAtom('bar');
            useEffect(() => {
                setFoo('bar');
                setBar('foo');
            }, []);
            return { value: foo() + bar() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foobar</div>');
        flush();
        expect(root.outerHTML).toEqual('<div>barfoo</div>');
        expect(called).toEqual(2);
    });
    it('should apply setState calls from the component function without rerendering', () => {
        const root = document.createElement('div');
        let called = 0;
        const values = [];
        const MyComponent = createComponent(() => {
            called++;
            const [foo, setFoo] = useAtom('foo');
            const [bar, setBar] = useAtom('bar');
            values.push(foo(), bar());
            setFoo('foo1');
            setFoo('foo2');
            setBar('bar1');
            setBar('bar2');
            return { value: foo() + bar() };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>foo2bar2</div>');
        expect(called).toEqual(2);
        expect(values).toEqual(['foo', 'bar', 'foo2', 'bar2']);
    });
    it('should throw when component function leads to an infinite loop', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(() => {
            const [, setValue, value] = useAtom(0);
            setValue(value + 1);
            return { value };
        }, template);

        expect(() => {
            render(root, MyComponent);
        }).toThrow(
            'Too many re-renders. Melody limits the number of renders to prevent an infinite loop.'
        );
    });
});
