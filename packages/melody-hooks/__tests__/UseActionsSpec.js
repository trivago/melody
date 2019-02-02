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

import { createTestComponent } from './util/createTestComponent';
import { createMockStore } from './util/createMockStore';
import { useStore, useActions } from '../src';

let store;
beforeEach(() => {
    store = createMockStore();
});
const selector = state => state.foo;

const actionCreator = value => ({ type: 'SET', payload: value });

describe('useActions', () => {
    it('should throw when no store was passed', () => {
        const componentFn = () => {
            const action = useActions();
            return {
                action,
            };
        };
        const tester = createTestComponent(componentFn);
        expect(() => tester.render()).toThrow(
            'useActions: expected first argument to be a redux store, instead received undefined'
        );
        tester.unmount();
    });
    it('should throw when no action creators were passed', () => {
        const componentFn = () => {
            const action = useActions(store);
            return {
                action,
            };
        };
        const tester = createTestComponent(componentFn);
        expect(() => tester.render()).toThrow(
            'useActions: expected second argument to be an object or a function, instead received undefined'
        );
        tester.unmount();
    });
    describe('single action creator', () => {
        it('should bind a single action creator', () => {
            const componentFn = () => {
                const state = useStore(store, selector);
                const action = useActions(store, actionCreator);
                return {
                    state,
                    action,
                };
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            const { action } = tester.getData();
            expect(typeof action).toBe('function');

            action('qux');
            tester.flush();
            const { state, action: action2 } = tester.getData();
            expect(action).toBe(action2);
            expect(state).toEqual('qux');

            tester.unmount();
        });
        it('should rebind if a new function was passed', () => {
            const componentFn = () => {
                const state = useStore(store, selector);
                const action = useActions(store, value => ({
                    type: 'SET',
                    payload: value,
                }));
                return {
                    state,
                    action,
                };
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            const { action } = tester.getData();

            action('qux');
            tester.flush();
            const { action: action2 } = tester.getData();
            expect(action).not.toBe(action2);

            tester.unmount();
        });
    });
    describe('multiple action creators', () => {
        const setNom = () => actionCreator('nom');
        const setQux = () => actionCreator('qux');
        const actionCreators = { setNom, setQux };

        it('should bind multiple action creators', () => {
            const componentFn = () => {
                const state = useStore(store, selector);
                const actions = useActions(store, actionCreators);
                return {
                    state,
                    ...actions,
                };
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            const { setNom, setQux } = tester.getData();
            expect(typeof setNom).toBe('function');
            expect(typeof setQux).toBe('function');

            setNom();
            tester.flush();
            const {
                state,
                setNom: setNom2,
                setQux: setQux2,
            } = tester.getData();
            expect(setNom).toBe(setNom2);
            expect(setQux).toBe(setQux2);
            expect(state).toEqual('nom');

            setQux2();
            tester.flush();
            const {
                state: state3,
                setNom: setNom3,
                setQux: setQux3,
            } = tester.getData();
            expect(setNom2).toBe(setNom3);
            expect(setQux2).toBe(setQux3);
            expect(state3).toEqual('qux');

            tester.unmount();
        });
        it('should not rebind if actionCreators are shallowly equal', () => {
            const componentFn = () => {
                const state = useStore(store, selector);
                const actions = useActions(store, { setNom, setQux });
                return {
                    state,
                    ...actions,
                };
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            const {
                setNom: setNomBound,
                setQux: setQuxBound,
            } = tester.getData();
            expect(typeof setNomBound).toBe('function');
            expect(typeof setQuxBound).toBe('function');

            setNomBound();
            tester.flush();
            const {
                setNom: setNomBound2,
                setQux: setQuxBound2,
            } = tester.getData();
            expect(setNomBound).toBe(setNomBound2);
            expect(setQuxBound).toBe(setQuxBound2);

            tester.unmount();
        });
        it('should rebind if actionCreators are not shallowly equal', () => {
            const componentFn = () => {
                const state = useStore(store, selector);
                const actions = useActions(store, {
                    setNom: () => actionCreator('nom'),
                    setQux: () => actionCreator('qux'),
                });
                return {
                    state,
                    ...actions,
                };
            };
            const tester = createTestComponent(componentFn);

            tester.render();
            const {
                setNom: setNomBound,
                setQux: setQuxBound,
            } = tester.getData();
            expect(typeof setNomBound).toBe('function');
            expect(typeof setQuxBound).toBe('function');

            setNomBound();
            tester.flush();
            const {
                setNom: setNomBound2,
                setQux: setQuxBound2,
            } = tester.getData();
            expect(setNomBound).not.toBe(setNomBound2);
            expect(setQuxBound).not.toBe(setQuxBound2);

            tester.unmount();
        });
    });
});
