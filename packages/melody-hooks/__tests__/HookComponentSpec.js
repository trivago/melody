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

import { render, unmountComponentAtNode } from 'melody-component';
import {
    flush,
    component,
    elementOpen,
    elementClose,
    elementVoid,
    text,
} from 'melody-idom';
import {
    createComponent,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useReducer,
} from '../src';
import { getRefCounter } from '../src/hooks/useRef';

const flushNow = () =>
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

const createParentComponent = Child => {
    return createComponent({
        render(_context) {
            elementOpen('div');
            if (_context.show) {
                component(Child, 'MyComponent');
            }
            elementClose('div');
        },
    });
};

let uniqueId = 0;
const unique = () => uniqueId++;

describe('HookComponent', () => {
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
            flushNow();
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
            flushNow();
            assert.equal(root.outerHTML, '<div>foofoo</div>');
        });
    });
    describe('useEffect', () => {
        describe('without unsubscribe', () => {
            it('should call effect on mount', () => {
                const root = document.createElement('div');
                let called = 0;
                let rerender;
                const MyComponent = createComponent(template, () => {
                    rerender = useState()[1];
                    useEffect(() => {
                        called++;
                    });
                });
                render(root, MyComponent);
                assert.equal(called, 1);
                rerender(unique());
                flushNow();
                assert.equal(called, 1);
            });
            it('should call effect on mount and every update', () => {
                const root = document.createElement('div');
                let called = 0;
                let rerender;
                const MyComponent = createComponent(template, () => {
                    rerender = useState()[1];
                    useEffect(() => {
                        called++;
                    }, true);
                });
                render(root, MyComponent);
                assert.equal(called, 1);
                rerender(unique());
                flushNow();
                assert.equal(called, 2);
                rerender(unique());
                flushNow();
                assert.equal(called, 3);
            });
            it('should call effect on mount and when a value changes', () => {
                const root = document.createElement('div');
                let called = 0;
                let rerender;
                let setValue;
                const MyComponent = createComponent(template, () => {
                    rerender = useState()[1];
                    const state = useState(0);
                    const value = state[0];
                    setValue = state[1];
                    useEffect(
                        () => {
                            called++;
                        },
                        [value]
                    );
                    return {
                        value,
                    };
                });
                render(root, MyComponent);
                assert.equal(root.outerHTML, '<div>0</div>');
                assert.equal(called, 1);
                rerender(unique());
                flushNow();
                assert.equal(called, 1);
                setValue(1);
                flushNow();
                assert.equal(root.outerHTML, '<div>1</div>');
                assert.equal(called, 2);
                rerender(unique());
                flushNow();
                assert.equal(root.outerHTML, '<div>1</div>');
                assert.equal(called, 2);
            });
        });
        describe('with unsubscribe', () => {
            it('should call effect on mount and unsubscribe on unmount', () => {
                const root = document.createElement('div');
                let called = 0;
                let calledUnsubscribe = 0;
                let rerender;
                const MyComponent = createComponent(template, () => {
                    rerender = useState()[1];
                    useEffect(() => {
                        called++;
                        return () => {
                            calledUnsubscribe++;
                        };
                    });
                });
                render(root, MyComponent);
                assert.equal(called, 1);
                assert.equal(calledUnsubscribe, 0);
                rerender(unique());
                flushNow();
                assert.equal(called, 1);
                assert.equal(calledUnsubscribe, 0);
                unmountComponentAtNode(root);
                assert.equal(calledUnsubscribe, 1);
            });
            it('should call effect on mount and every update and unsubscribe after every update and on unmount', () => {
                const root = document.createElement('div');
                let called = 0;
                let calledUnsubscribe = 0;
                let rerender;
                const MyComponent = createComponent(template, () => {
                    rerender = useState()[1];
                    useEffect(() => {
                        called++;
                        return () => {
                            calledUnsubscribe++;
                        };
                    }, true);
                });
                render(root, MyComponent);
                assert.equal(called, 1);
                assert.equal(calledUnsubscribe, 0);
                rerender(unique());
                flushNow();
                assert.equal(called, 2);
                assert.equal(calledUnsubscribe, 1);
                rerender(unique());
                flushNow();
                assert.equal(called, 3);
                assert.equal(calledUnsubscribe, 2);
                unmountComponentAtNode(root);
                assert.equal(calledUnsubscribe, 3);
            });
            it('should call effect on mount and when a value changes', () => {
                const root = document.createElement('div');
                let called = 0;
                let calledUnsubscribe = 0;
                let rerender;
                let setValue;
                const MyComponent = createComponent(template, () => {
                    rerender = useState()[1];
                    const state = useState(0);
                    const value = state[0];
                    setValue = state[1];
                    useEffect(
                        () => {
                            called++;
                            return () => {
                                calledUnsubscribe++;
                            };
                        },
                        [value]
                    );
                    return {
                        value,
                    };
                });
                render(root, MyComponent);
                assert.equal(root.outerHTML, '<div>0</div>');
                assert.equal(called, 1);
                assert.equal(calledUnsubscribe, 0);
                rerender(unique());
                flushNow();
                assert.equal(called, 1);
                assert.equal(calledUnsubscribe, 0);
                setValue(1);
                flushNow();
                assert.equal(root.outerHTML, '<div>1</div>');
                assert.equal(called, 2);
                assert.equal(calledUnsubscribe, 1);
                rerender(unique());
                flushNow();
                assert.equal(root.outerHTML, '<div>1</div>');
                assert.equal(called, 2);
                unmountComponentAtNode(root);
                assert.equal(calledUnsubscribe, 2);
            });
        });
    });
    describe('useRef', () => {
        it('should give a reference to the element', () => {
            const template = {
                render(_context) {
                    elementVoid('div', null, null, 'ref', _context.myref);
                },
            };
            const root = document.createElement('div');
            let current;
            let currentInEffect;
            let ref;
            const MyComponent = createComponent(template, () => {
                const myref = useRef(null);
                ref = myref;
                current = myref.current;
                useEffect(() => {
                    currentInEffect = myref.current;
                });
                return { myref };
            });
            render(root, MyComponent);
            assert.equal(current, null);
            assert.instanceOf(currentInEffect, HTMLDivElement);
        });
        it('should remove the reference when a component is unmounted', () => {
            const root = document.createElement('div');
            let ref;
            const Child = createComponent(
                {
                    render(_context) {
                        elementOpen('span');
                        elementVoid('div', null, null, 'ref', _context.myref);
                        elementClose('span');
                    },
                },
                () => {
                    const myref = useRef(null);
                    ref = myref;
                    return { myref };
                }
            );
            const Parent = createParentComponent(Child);
            render(root, Parent, { show: true });
            assert.equal(getRefCounter(ref), 0);
            render(root, Parent, { show: false });
            assert.equal(getRefCounter(ref), -1);
            assert.equal(ref.current, undefined);
        });
        it('should move the reference to another element', () => {
            const template = {
                render(_context) {
                    elementOpen('div');
                    if (_context.foo) {
                        elementVoid(
                            'span',
                            null,
                            ['class', 'foo'],
                            'ref',
                            _context.myref
                        );
                    } else {
                        elementVoid(
                            'div',
                            null,
                            ['class', 'bar'],
                            'ref',
                            _context.myref
                        );
                    }
                    elementClose('div');
                },
            };
            const root = document.createElement('div');
            let setter;
            let ref;
            let current;
            let currentInEffect;
            const MyComponent = createComponent(template, () => {
                const [foo, setFoo] = useState(false);
                setter = setFoo;
                const myref = useRef(null);
                ref = myref;
                current = myref.current;
                useEffect(() => {
                    currentInEffect = myref.current;
                }, true);
                return { myref, foo };
            });
            render(root, MyComponent);
            assert.equal(current, null);
            assert.equal(currentInEffect.className, 'bar');
            assert.equal(getRefCounter(ref), 0);
            setter(true);
            flushNow();
            assert.equal(current.className, 'bar');
            assert.equal(currentInEffect.className, 'foo');
            assert.equal(getRefCounter(ref), 0);
            setter(false);
            flushNow();
            assert.equal(current.className, 'foo');
            assert.equal(getRefCounter(ref), 0);
        });
    });
    describe('useCallback', () => {
        it('should return a memoized callback', () => {
            const root = document.createElement('div');
            const callbacks = [];
            let setter;
            const MyComponent = createComponent(template, () => {
                const [value, setValue] = useState(false);
                setter = setValue;
                const callback = useCallback(() => {});
                callbacks.push(callback);
                return { value };
            });
            render(root, MyComponent);
            setter(true);
            flushNow();
            setter(false);
            flushNow();
            assert.equal(
                callbacks[0] === callbacks[1] && callbacks[1] === callbacks[2],
                true
            );
        });
        it('should return an updated callback when inputs change', () => {
            const root = document.createElement('div');
            const callbacks = [];
            let setter;
            const MyComponent = createComponent(template, () => {
                const [value, setValue] = useState(false);
                setter = setValue;
                const callback = useCallback(() => {}, [value]);
                callbacks.push(callback);
                return { value };
            });
            render(root, MyComponent);
            setter(true);
            flushNow();
            setter(false);
            flushNow();
            assert.equal(
                callbacks[0] !== callbacks[1] &&
                    callbacks[1] !== callbacks[2] &&
                    callbacks[2] !== callbacks[0],
                true
            );
        });
    });
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
            flushNow();
            setter(false);
            flushNow();
            assert.equal(
                values[0] === values[1] && values[1] === values[2],
                true
            );
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
            flushNow();
            setter(false);
            flushNow();
            assert.equal(
                values[0] !== values[1] &&
                    values[1] !== values[2] &&
                    values[2] !== values[0],
                true
            );
        });
    });
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
            const MyComponent = createComponent(template, () => {
                const [value] = useReducer(reducer, initialState);
                return { value: JSON.stringify(value) };
            });
            render(root, MyComponent);
            assert.equal(
                root.outerHTML,
                '<div>{"foo":"bar","bar":"foo"}</div>'
            );
        });
        it('should update when an action is dispatched', () => {
            const root = document.createElement('div');
            let setter;
            const MyComponent = createComponent(template, () => {
                const [state, dispatch] = useReducer(reducer, initialState);
                setter = dispatch;
                return { value: JSON.stringify(state) };
            });
            render(root, MyComponent);
            assert.equal(
                root.outerHTML,
                '<div>{"foo":"bar","bar":"foo"}</div>'
            );
            setter({ type: 'FOO_CHANGED', payload: 'qux' });
            flushNow();
            assert.equal(
                root.outerHTML,
                '<div>{"foo":"qux","bar":"foo"}</div>'
            );
        });
        it('should not update when an unhandled action is dispatched', () => {
            const root = document.createElement('div');
            let setter;
            let called = 0;
            const MyComponent = createComponent(template, () => {
                const [state, dispatch] = useReducer(reducer, initialState);
                called++;
                setter = dispatch;
                return { value: JSON.stringify(state) };
            });
            render(root, MyComponent);
            assert.equal(
                root.outerHTML,
                '<div>{"foo":"bar","bar":"foo"}</div>'
            );
            setter({ type: 'UNHANDLED', payload: 42 });
            flushNow();
            assert.equal(
                root.outerHTML,
                '<div>{"foo":"bar","bar":"foo"}</div>'
            );
            assert.equal(called, 1);
        });
        it('should throw when no reducer function was passed', () => {
            const root = document.createElement('div');
            const MyComponent = createComponent(template, () => {
                const [value] = useReducer();
                return { value: JSON.stringify(value) };
            });
            assert.throws(() => {
                render(root, MyComponent);
            }, '`useReducer` expects a reducer function as first argument');
        });
    });
});
