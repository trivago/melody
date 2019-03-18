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

import { RECEIVE_PROPS } from 'melody-component';
import { createActionReducer, dispatchToState, exposeToState } from '../src';

describe('Reducer utils', function() {
    describe('createActionReducer', function() {
        it('delegates to the correct action handler', function() {
            const reducer = createActionReducer(
                {
                    inc(state, action) {
                        return Object.assign({}, state, {
                            count: state.count + 1,
                        });
                    },
                    dec(state, action) {
                        return Object.assign({}, state, {
                            count: state.count - 1,
                        });
                    },
                    noop(state, action) {},
                },
                { count: 5 }
            );

            expect(reducer({ count: 1 }, { type: 'inc' })).toEqual({
                count: 2,
            });
            expect(reducer({ count: 2 }, { type: 'inc' })).toEqual({
                count: 3,
            });
            expect(reducer({ count: 2 }, { type: 'dec' })).toEqual({
                count: 1,
            });
            expect(reducer({ count: 2 }, { type: 'noop' })).toEqual({
                count: 2,
            });
            expect(reducer({ count: 2 }, { type: 'unknown' })).toEqual({
                count: 2,
            });
            expect(reducer(undefined, { type: 'unknown' })).toEqual({
                count: 5,
            });
            expect(reducer(undefined, { type: 'inc' })).toEqual({ count: 6 });
            expect(reducer(undefined, { type: 'noop' })).toEqual({ count: 5 });
        });
    });

    describe('dispatchToState', function() {
        it('should add the dispatch methods to state', function() {
            const reducer = dispatchToState(dispatch => ({
                test() {
                    dispatch({ type: 'test' });
                },
            }));
            const dispatch = jest.fn();

            const state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                }
            );
            expect(typeof state.test).toEqual('function');
            state.test();
            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(dispatch).toHaveBeenLastCalledWith({ type: 'test' });
        });

        it('should invoke the dispatch mapper only once', function() {
            const test = jest.fn();
            const dispatchMapper = jest.fn(() => ({ test }));
            const reducer = dispatchToState(dispatchMapper);
            const dispatch = jest.fn();

            let state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                }
            );
            state = reducer(state, {
                type: 'MELODY/RECEIVE_PROPS',
                meta: { dispatch },
            });
            state = reducer(state, {
                type: 'fun',
                meta: { dispatch },
            });

            expect(dispatchMapper).toHaveBeenCalledTimes(1);
            expect(typeof state.test).toEqual('function');
        });
    });

    describe('dispatchToState when given an object', function() {
        it('should use the objects methods as action creators', function() {
            const dispatch = jest.fn();
            const reducer = dispatchToState({
                test(payload) {
                    return {
                        type: 'FOO',
                        payload: payload,
                    };
                },
            });

            const state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                }
            );

            state.test('hello world');

            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(dispatch).toHaveBeenCalledWith({
                type: 'FOO',
                payload: 'hello world',
            });
        });

        it('should ignore non-function properties', function() {
            const dispatch = jest.fn();
            const reducer = dispatchToState({
                hello: 'foo',
                test(payload) {
                    return {
                        type: 'FOO',
                        payload: payload,
                    };
                },
            });

            const state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                }
            );

            state.test('hello world');

            expect(typeof state.hello).toEqual('undefined');
        });
    });

    describe('dispatchToState with props dependency', function() {
        it('should invoke the dispatch mapper every time props change', function() {
            let counter = 0;
            const dispatchMapper = (dispatch, props) => {
                counter++;
                return {
                    test() {
                        dispatch({ type: 'test', payload: props.val });
                    },
                };
            };
            const reducer = dispatchToState(dispatchMapper);
            const dispatch = jest.fn();

            let state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                    payload: { val: 21 },
                }
            );
            expect(counter).toEqual(1);
            state.test();
            expect(dispatch).toHaveBeenCalledWith({
                type: 'test',
                payload: 21,
            });

            state = reducer(state, {
                type: 'MELODY/RECEIVE_PROPS',
                meta: { dispatch },
                payload: { val: 42 },
            });

            expect(counter).toEqual(2);
            state.test();
            expect(dispatch).toHaveBeenCalledWith({
                type: 'test',
                payload: 42,
            });

            state = reducer(state, {
                type: 'fun',
                payload: { val: 42 },
            });

            expect(counter).toEqual(2);
            state.test();
            expect(dispatch).toHaveBeenCalledWith({
                type: 'test',
                payload: 42,
            });
        });
    });
    describe('exposeToState', function() {
        const initialState = { foo: false };
        const reducer = (state = initialState, { type, payload }) => {
            if (type === RECEIVE_PROPS) {
                return Object.assign({}, state, payload);
            }
            if (type === 'TOGGLE') {
                return Object.assign({}, state, {
                    foo: !state.foo,
                });
            }
            return state;
        };

        const log = [];
        const component = {
            handleToggle() {
                log.push(this);
            },
            doNotExpose() {},
            notAFunction: 1337,
        };

        it('should expose given functions to the state', function() {
            const finalReducer = exposeToState(['handleToggle'], reducer);
            const state = finalReducer(
                {},
                {
                    type: RECEIVE_PROPS,
                    meta: component,
                    payload: {
                        qux: 'bar',
                    },
                }
            );

            expect(state.qux).toEqual('bar');
            expect(typeof state.handleToggle === 'function').toBeTruthy();
            expect(state.doNotExpose).toBeUndefined();

            state.handleToggle();
            expect(log).toEqual([component]);

            const state2 = finalReducer(state, {
                type: RECEIVE_PROPS,
                meta: component,
                payload: {
                    qux: 'bar',
                },
            });

            expect(state.handleToggle).toEqual(state2.handleToggle);
        });

        it('should take a default reducer if no reducer was given', function() {
            const finalReducer = exposeToState(['handleToggle']);
            const state = finalReducer(
                {},
                {
                    type: RECEIVE_PROPS,
                    meta: component,
                    payload: {
                        qux: 'bar',
                    },
                }
            );
            expect(state.qux).toEqual('bar');
            expect(typeof state.handleToggle === 'function').toBeTruthy();
        });

        it('should take a ignore actions not known by the default reducer', function() {
            const finalReducer = exposeToState(['handleToggle']);
            const givenState = {};
            const state = finalReducer(givenState, {
                type: 'foo',
                meta: component,
                payload: {
                    qux: 'bar',
                },
            });
            expect(state).toEqual(givenState);
        });

        it('should be able to deal with an undefined state in the default reducer even if it does not know the action type', function() {
            const finalReducer = exposeToState(['handleToggle']);
            const state = finalReducer(undefined, {
                type: 'foo',
                meta: component,
                payload: {
                    qux: 'bar',
                },
            });
            expect(state).toEqual({});
        });

        it('should be able to deal with an undefined state in the default reducer', function() {
            const finalReducer = exposeToState(['handleToggle']);
            const state = finalReducer(undefined, {
                type: RECEIVE_PROPS,
                meta: component,
                payload: {
                    qux: 'bar',
                },
            });
            expect(state.qux).toEqual('bar');
            expect(typeof state.handleToggle === 'function').toBeTruthy();
        });

        it('should throw if given property is not a function', function() {
            const finalReducer = exposeToState(['notAFunction'], reducer);
            const error = new Error(
                'Property `notAFunction` is not a function. Only functions can be exposed to the state.'
            );
            expect(() =>
                finalReducer(
                    {},
                    { type: RECEIVE_PROPS, meta: component, payload: {} }
                )
            ).toThrowError(error);
        });

        it('should throw if given property is was not found', function() {
            const finalReducer = exposeToState(['notFound'], reducer);
            const error = new Error(
                'Property `notFound` was not found on the component.'
            );
            expect(() =>
                finalReducer(
                    {},
                    { type: RECEIVE_PROPS, meta: component, payload: {} }
                )
            ).toThrowError(error);
        });
    });
});
