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
import { assert } from 'chai';

import {
    createHookComponent,
    render,
    useState,
    useEffect,
    useRef,
    unmountComponentAtNode,
} from '../src';
import {
    patch,
    patchOuter,
    flush,
    component,
    ref,
    elementOpen,
    elementClose,
    elementVoid,
    text,
} from 'melody-idom';
import { getRefCounter } from '../src/hookComponent';

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
    return createHookComponent({
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

describe('HookComponent', function() {
    describe('useState', () => {
        it('should read initial value from a useState hook', function() {
            const root = document.createElement('div');
            const MyComponent = createHookComponent(template, () => {
                const [value] = useState('foo');
                return { value };
            });
            render(root, MyComponent);
            assert.equal(root.outerHTML, '<div>foo</div>');
        });
        it('should read multiple initial values from useState hooks', function() {
            const root = document.createElement('div');
            const MyComponent = createHookComponent(template, () => {
                const [foo] = useState('foo');
                const [bar] = useState('bar');
                return { value: foo + bar };
            });
            render(root, MyComponent);
            assert.equal(root.outerHTML, '<div>foobar</div>');
        });
        it('should update when state is changed', function() {
            const root = document.createElement('div');
            let setter;
            const MyComponent = createHookComponent(template, () => {
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
        it('should update when state is changed 2', function() {
            const root = document.createElement('div');
            let setter;
            const MyComponent = createHookComponent(template, () => {
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
            it('should call effect on mount', function() {
                const root = document.createElement('div');
                let called = 0;
                let rerender;
                const MyComponent = createHookComponent(template, () => {
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
            it('should call effect on mount and every update', function() {
                const root = document.createElement('div');
                let called = 0;
                let rerender;
                const MyComponent = createHookComponent(template, () => {
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
            it('should call effect on mount and when a value changes', function() {
                const root = document.createElement('div');
                let called = 0;
                let rerender;
                let setValue;
                const MyComponent = createHookComponent(template, () => {
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
            it('should call effect on mount and unsubscribe on unmount', function() {
                const root = document.createElement('div');
                let called = 0;
                let calledUnsubscribe = 0;
                let rerender;
                const MyComponent = createHookComponent(template, () => {
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
            it('should call effect on mount and every update and unsubscribe after every update and on unmount', function() {
                const root = document.createElement('div');
                let called = 0;
                let calledUnsubscribe = 0;
                let rerender;
                const MyComponent = createHookComponent(template, () => {
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
            it('should call effect on mount and when a value changes', function() {
                const root = document.createElement('div');
                let called = 0;
                let calledUnsubscribe = 0;
                let rerender;
                let setValue;
                const MyComponent = createHookComponent(template, () => {
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
            const MyComponent = createHookComponent(template, () => {
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
            const Child = createHookComponent(
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
            const MyComponent = createHookComponent(template, () => {
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
});
