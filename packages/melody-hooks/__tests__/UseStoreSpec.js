/**
 * Copyright 2019 trivago N.V.
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

import { elementOpen, elementClose, text, component } from 'melody-idom';
import { createTestComponent } from './util/createTestComponent';
import { createMockStore } from './util/createMockStore';
import { useStore, createComponent } from '../src';

let store;
beforeEach(() => {
    store = createMockStore();
});

describe('useStore', () => {
    describe('basic functionality', () => {
        const selector = state => ({ qux: state.foo });
        const componentFn = props => {
            const state = useStore(store, selector);
            return state;
        };
        it('should throw when no store was passed', () => {
            const componentFn = () => {
                const state = useStore();
                return {
                    state,
                };
            };
            const tester = createTestComponent(componentFn);
            expect(() => tester.render()).toThrow(
                'useStore: expected first argument to be a redux store, instead received undefined'
            );
            tester.unmount();
        });
        it('should throw when no selector function was passed', () => {
            const componentFn = () => {
                const state = useStore(store, null);
                return {
                    state,
                };
            };
            const tester = createTestComponent(componentFn);
            expect(() => tester.render()).toThrow(
                'useStore: expected second argument to be a selector function, instead received object'
            );
            tester.unmount();
        });
        it('should render the initial state', () => {
            const tester = createTestComponent(componentFn);

            tester.render();
            expect(tester.getData()).toEqual({ qux: 'bar' });
            expect(tester.getCallCount()).toEqual(1);
            tester.unmount();
        });
        it('should rerender when selected data changes', () => {
            const tester = createTestComponent(componentFn);

            tester.render();
            expect(tester.getData()).toEqual({ qux: 'bar' });

            store.dispatch({ type: 'SET', payload: 'woo' });
            tester.flush();
            expect(tester.getData()).toEqual({ qux: 'woo' });
            expect(tester.getCallCount()).toEqual(2);

            tester.unmount();
        });
        it('should not rerender when selected value is shallowly equal', () => {
            const componentFn = props => {
                const state = useStore(store, state => ({
                    iso: state.foo,
                    osi: state.foo + state.foo,
                }));
                return state;
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            expect(tester.getData()).toEqual({ iso: 'bar', osi: 'barbar' });

            store.dispatch({ type: 'SET', payload: 'bar' });
            tester.flush();
            expect(tester.getCallCount()).toEqual(1);

            tester.unmount();
        });
        it('should rerender when the store changes', () => {
            const store2 = createMockStore({ foo: 'nom' });
            const componentFn = props => {
                const storeToUse = props.switch ? store2 : store;
                const state = useStore(storeToUse, selector);
                return state;
            };
            const tester = createTestComponent(componentFn);
            tester.render({ switch: false });
            expect(tester.getData()).toEqual({ qux: 'bar' });
            tester.render({ switch: true });
            expect(tester.getData()).toEqual({ qux: 'nom' });
            expect(tester.getCallCount()).toEqual(2);

            tester.unmount();
        });
    });
    describe('selector', () => {
        it('should throw when you try to access props', () => {
            const componentFn = props => {
                const state = useStore(store, (state, props) => ({
                    qux: props.foo,
                }));
                return state;
            };
            const tester = createTestComponent(componentFn);

            expect(() => tester.render()).toThrow(
                'useStore: You tried to access `props` in a selector. `props` cannot be passed to selectors. Instead use properties from outside of the selector function'
            );
            tester.unmount();
        });
        it('should throw when you pass a selector creator', () => {
            const createSelector = () => state => state.foo;
            const componentFn = props => {
                const state = useStore(store, createSelector);
                return state;
            };
            const tester = createTestComponent(componentFn);

            expect(() => tester.render()).toThrow(
                'useStore: the selector that was passed to useStore returned a function. This might be because you tried to pass a selector creator. This is not allowed with melody-hooks'
            );
            tester.unmount();
        });
        it('should not resubscribe when selector changes', () => {
            const componentFn = props => {
                const selector = state => ({
                    qux: state.foo,
                });
                // `selector` is recreated on every cycle
                const state = useStore(store, selector);
                return state;
            };
            const tester = createTestComponent(componentFn);
            const spy = jest.spyOn(store, 'subscribe');

            tester.render();
            store.dispatch({ type: 'SET', payload: 'woo' });
            tester.flush();
            expect(tester.getData()).toEqual({ qux: 'woo' });
            expect(spy.mock.calls).toHaveLength(1);

            spy.mockRestore();
            tester.unmount();
        });
        it('should support scalar values', () => {
            const selector = state => state.foo;
            const componentFn = props => {
                const state = useStore(store, selector);
                return state;
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            expect(tester.getData()).toEqual('bar');
            expect(tester.getCallCount()).toEqual(1);
            tester.unmount();
        });
        it('should support arrays', () => {
            const selector = state => ['foo', state.foo];
            const componentFn = props => {
                const state = useStore(store, selector);
                return state;
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            expect(tester.getData()).toEqual(['foo', 'bar']);
            expect(tester.getCallCount()).toEqual(1);
            tester.unmount();
        });
    });
    describe('store', () => {
        it('should resubscribe when the store changes', () => {
            const store2 = createMockStore({ foo: 'nom' });
            const componentFn = props => {
                const storeToUse = props.switch ? store2 : store;
                const state = useStore(storeToUse, state => ({
                    qux: state.foo,
                }));
                return state;
            };
            const tester = createTestComponent(componentFn);
            const spy = jest.spyOn(store, 'subscribe');

            tester.render({ switch: false });
            expect(tester.getData()).toEqual({ qux: 'bar' });
            tester.render({ switch: true });
            expect(tester.getData()).toEqual({ qux: 'nom' });
            expect(spy.mock.calls).toHaveLength(1);

            spy.mockRestore();
            tester.unmount();
        });
    });
    describe('complex component tree', () => {
        it('should work', () => {
            const store = createMockStore({
                foo: 'nom',
                qux: 'qax',
            });

            const selector = state => ({
                value: state.foo + state.qux,
            });

            let componentARendered = 0;
            let componentACalled = 0;

            const A = createComponent(
                () => {
                    componentACalled++;
                    const state = useStore(store, selector);
                    return {
                        value: `${state.value}A`,
                    };
                },
                {
                    render(_context) {
                        componentARendered++;
                        elementOpen('span');
                        text(_context.value);
                        elementClose('span');
                    },
                }
            );

            const tester = createTestComponent(
                () => {
                    const state = useStore(store, selector);
                    return {
                        value: `${state.value}Root`,
                    };
                },
                {
                    render(_context) {
                        elementOpen('div');
                        text(_context.value);
                        component(A, 1);
                        elementClose('div');
                    },
                }
            );

            tester.render();
            expect(tester.getHtml()).toEqual(
                '<div>nomqaxRoot<span>nomqaxA</span></div>'
            );
            expect(tester.getCallCount()).toEqual(1);
            expect(tester.getRenderCount()).toEqual(1);
            expect(componentACalled).toEqual(1);
            expect(componentARendered).toEqual(1);

            store.dispatch({ type: 'SET', payload: 'woo' });
            tester.flush();
            expect(tester.getHtml()).toEqual(
                '<div>wooqaxRoot<span>wooqaxA</span></div>'
            );
            expect(tester.getCallCount()).toEqual(2);
            expect(tester.getRenderCount()).toEqual(2);
            expect(componentACalled).toEqual(2);
            expect(componentARendered).toEqual(2);
        });
    });
    describe('multiple hooks', function() {
        it('should render and update components correctly', function() {
            let selectorCalls = 0;
            const selector = state => {
                selectorCalls++;
                return {
                    qux: state.foo,
                };
            };
            const componentFn = props => {
                const state = useStore(store, selector);
                const state2 = useStore(store, selector);
                return {
                    state: state,
                    state2: state2,
                };
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            expect(tester.getData()).toEqual({
                state: { qux: 'bar' },
                state2: { qux: 'bar' },
            });

            store.dispatch({ type: 'SET', payload: 'woo' });
            tester.flush();
            expect(tester.getData()).toEqual({
                state: { qux: 'woo' },
                state2: { qux: 'woo' },
            });

            expect(selectorCalls).toEqual(6);
            expect(tester.getRenderCount()).toEqual(2);
            expect(tester.getCallCount()).toEqual(2);

            tester.unmount();
        });
    });
});
