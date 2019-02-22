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
import { createComponent, useReducer } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('useReducer', () => {
    const initialState = {
        foo: 'bar',
        bar: 'foo',
    };
    const reducer = (state, action) => {
        switch (action.type) {
            case 'FOO_CHANGED': {
                return {
                    ...state,
                    foo: action.payload,
                };
            }
            default: {
                return state;
            }
        }
    };
    it('should read initialState from a useReducer hook', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(() => {
            const [value] = useReducer(reducer, initialState);
            return { value: JSON.stringify(value) };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>{"foo":"bar","bar":"foo"}</div>');
    });
    it('should update when an action is dispatched', () => {
        const root = document.createElement('div');
        let setter;
        const MyComponent = createComponent(() => {
            const [state, dispatch] = useReducer(reducer, initialState);
            setter = dispatch;
            return { value: JSON.stringify(state) };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>{"foo":"bar","bar":"foo"}</div>');
        setter({ type: 'FOO_CHANGED', payload: 'qux' });
        flush();
        expect(root.outerHTML).toEqual('<div>{"foo":"qux","bar":"foo"}</div>');
    });
    it('should not update when an unhandled action is dispatched', () => {
        const root = document.createElement('div');
        let setter;
        let called = 0;
        const MyComponent = createComponent(() => {
            const [state, dispatch] = useReducer(reducer, initialState);
            called++;
            setter = dispatch;
            return { value: JSON.stringify(state) };
        }, template);
        render(root, MyComponent);
        expect(root.outerHTML).toEqual('<div>{"foo":"bar","bar":"foo"}</div>');
        setter({ type: 'UNHANDLED', payload: 42 });
        flush();
        expect(root.outerHTML).toEqual('<div>{"foo":"bar","bar":"foo"}</div>');
        expect(called).toEqual(1);
    });
    it('should throw when no reducer function was passed', () => {
        const root = document.createElement('div');
        const MyComponent = createComponent(() => {
            const [value] = useReducer();
            return { value: JSON.stringify(value) };
        }, template);
        const error = new Error(
            '`useReducer` expects a reducer function as first argument'
        );
        expect(() => {
            render(root, MyComponent);
        }).toThrow(error);
    });
});
