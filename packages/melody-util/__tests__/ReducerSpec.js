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
import { RECEIVE_PROPS } from 'melody-component';

import { createActionReducer, dispatchToState, exposeToState } from '../src';

import sinon from 'sinon';

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
                { count: 5 },
            );
            assert.equal(reducer({ count: 1 }, { type: 'inc' }).count, 2);
            assert.equal(reducer({ count: 2 }, { type: 'inc' }).count, 3);
            assert.equal(reducer({ count: 2 }, { type: 'dec' }).count, 1);
            assert.equal(reducer({ count: 2 }, { type: 'noop' }).count, 2);
            assert.equal(reducer({ count: 2 }, { type: 'unknown' }).count, 2);
            assert.equal(reducer(undefined, { type: 'unknown' }).count, 5);
            assert.equal(reducer(undefined, { type: 'inc' }).count, 6);
            assert.equal(reducer(undefined, { type: 'noop' }).count, 5);
        });
    });

    describe('dispatchToState', function() {
        it('should add the dispatch methods to state', function() {
            const reducer = dispatchToState(dispatch => ({
                test() {
                    dispatch({ type: 'test' });
                },
            }));
            const dispatch = sinon.spy();

            const state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                },
            );
            assert(typeof state.test === 'function', 'test is a function');
            state.test();
            assert(dispatch.calledOnce);
            assert(dispatch.calledWith({ type: 'test' }));
        });

        it('should invoke the dispatch mapper only once', function() {
            const test = sinon.spy();
            const dispatchMapper = sinon.stub().returns({ test });
            const reducer = dispatchToState(dispatchMapper);
            const dispatch = sinon.spy();

            let state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                },
            );
            state = reducer(state, {
                type: 'MELODY/RECEIVE_PROPS',
                meta: { dispatch },
            });
            state = reducer(state, {
                type: 'fun',
                meta: { dispatch },
            });
            assert(
                dispatchMapper.calledOnce,
                'dispatch mapper invoked exactly once',
            );
            assert(typeof state.test === 'function', 'test is a function');
        });
    });

    describe('dispatchToState when given an object', function() {
        it('should use the objects methods as action creators', function() {
            const dispatch = sinon.spy();
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
                },
            );

            state.test('hello world');
            assert(dispatch.calledOnce, 'dispatch was invoked once');
            assert(
                dispatch.calledWith({ type: 'FOO', payload: 'hello world' }),
                'dispatch was invoked with correct action',
            );
        });

        it('should ignore non-function properties', function() {
            const dispatch = sinon.spy();
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
                },
            );

            state.test('hello world');
            assert(
                typeof state.hello === 'undefined',
                'hello should not be copied over',
            );
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
            const dispatch = sinon.spy();

            let state = reducer(
                {},
                {
                    type: 'MELODY/RECEIVE_PROPS',
                    meta: { dispatch },
                    payload: { val: 21 },
                },
            );
            assert.equal(counter, 1, 'dispatchMapper called once');
            state.test();
            assert(
                dispatch.calledWith({
                    type: 'test',
                    payload: 21,
                }),
                'dispatch called with a payload of 21',
            );

            state = reducer(state, {
                type: 'MELODY/RECEIVE_PROPS',
                meta: { dispatch },
                payload: { val: 42 },
            });
            assert.equal(counter, 2, 'dispatchMapper called twice');
            state.test();
            assert(
                dispatch.calledWith({
                    type: 'test',
                    payload: 42,
                }),
                'dispatch called with a payload of 21',
            );

            state = reducer(state, {
                type: 'fun',
                payload: { val: 42 },
            });
            assert.equal(counter, 2, 'dispatchMapper called twice');
            state.test();
            assert(
                dispatch.calledWith({
                    type: 'test',
                    payload: 42,
                }),
                'dispatch called with a payload of 21',
            );
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
                },
            );

            assert(state.qux === 'bar', 'passes props to state');
            assert(
                typeof state.handleToggle === 'function',
                'handleToggle is a function',
            );
            assert(
                typeof state.doNotExpose === 'undefined',
                'only expose given functions',
            );

            state.handleToggle();
            assert.deepEqual(
                log,
                [component],
                'handleToggle is bound to the component',
            );

            const state2 = finalReducer(state, {
                type: RECEIVE_PROPS,
                meta: component,
                payload: {
                    qux: 'bar',
                },
            });
            assert(
                state.handleToggle === state2.handleToggle,
                'bound functions get memoized',
            );
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
                },
            );
            assert(state.qux === 'bar', 'passes props to state');
            assert(
                typeof state.handleToggle === 'function',
                'handleToggle is a function',
            );
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
            assert.equal(state, givenState);
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
            assert(state.qux === 'bar', 'passes props to state');
            assert(
                typeof state.handleToggle === 'function',
                'handleToggle is a function',
            );
        });
        it('should throw if given property is not a function', function() {
            const finalReducer = exposeToState(['notAFunction'], reducer);
            assert.throws(
                () =>
                    finalReducer(
                        {},
                        { type: RECEIVE_PROPS, meta: component, payload: {} },
                    ),
                'Property `notAFunction` is not a function. Only functions can be exposed to the state.',
            );
        });
        it('should throw if given property is was not found', function() {
            const finalReducer = exposeToState(['notFound'], reducer);
            assert.throws(
                () =>
                    finalReducer(
                        {},
                        { type: RECEIVE_PROPS, meta: component, payload: {} },
                    ),
                'Property `notFound` was not found on the component.',
            );
        });
    });
});
