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
import { createComponent } from 'melody-component';
import { applyMiddleware } from '../src';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';

describe('Middleware', function() {
    const tpl = {
        render(state) {
            // do nothing
        },
    };

    const countingReducer = (state = { count: 0 }, action) => {
        switch (action.type) {
            case 'inc':
                return { ...state, count: state.count + 1 };
            case 'dec':
                return { ...state, count: state.count - 1 };
        }
        return state;
    };

    it('should be possible to create a component', function() {
        const reducer = (state, action) => {
            return action.payload;
        };

        const el = document.createElement('div');
        const Component = createComponent(tpl, reducer);
        const comp = new Component(el);
        expect(!comp.getState()).toBeTruthy();
        comp.dispatch({ type: 'count', payload: { msg: 'hello' } });
        expect(!!comp.getState()).toBeTruthy();
        expect(comp.getState().msg).toEqual('hello');
    });

    it('can call dispatch as often as it wants to', function() {
        let reducerCalled = 0;
        const reducer = (state = { count: 0 }, action) => {
            if (action.type === 'count') {
                reducerCalled++;
                return { ...state, count: state.count + 1 };
            }
            return state;
        };

        const doubleDispatch = comp => next => action => {
            next(action);
            if (action.type === 'count') {
                next(action);
            }
        };

        const el = document.createElement('div');
        const Component = createComponent(
            tpl,
            reducer,
            applyMiddleware(doubleDispatch)
        );
        const comp = new Component(el);
        comp.dispatch({ type: 'count' });
        expect(reducerCalled).toEqual(2);
        expect(2).toEqual(comp.getState().count);
    });

    it('can filter dispatch calls', function() {
        const filterType = type => comp => next => action => {
            if (action.type === type) {
                next(action);
            }
        };

        const el = document.createElement('div');
        const Component = createComponent(
            tpl,
            countingReducer,
            applyMiddleware(filterType('inc'))
        );
        const comp = new Component(el);
        comp.dispatch({ type: 'inc' });
        comp.dispatch({ type: 'inc' });
        comp.dispatch({ type: 'dec' });
        comp.dispatch({ type: 'inc' });
        expect(3).toEqual(comp.getState().count);
    });

    describe('thunk middleware', function() {
        it('accepts a function as an action', function() {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(thunkMiddleware, null, undefined, false)
            );
            const comp = new Component(el);
            comp.dispatch(dispatch => {
                dispatch({ type: 'inc' });
                dispatch({ type: 'dec' });
                dispatch({ type: 'inc' });
            });
            expect(1).toEqual(comp.getState().count);
        });

        it('passes getState to the actor', function() {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(thunkMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch((dispatch, getState) => {
                dispatch({ type: 'inc' });
                expect(1).toEqual(getState().count);
                dispatch({ type: 'dec' });
                expect(0).toEqual(getState().count);
                dispatch({ type: 'inc' });
                expect(1).toEqual(getState().count);
            });
            expect(1).toEqual(comp.getState().count);
        });

        it('can be async', function(done) {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(thunkMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch(
                (dispatch, getState) =>
                    new Promise((resolve, reject) => {
                        dispatch({ type: 'inc' });
                        expect(1).toEqual(getState().count);
                        dispatch({ type: 'dec' });
                        expect(0).toEqual(getState().count);
                        dispatch({ type: 'inc' });
                        expect(1).toEqual(getState().count);
                        resolve();
                    })
            )
                .then(() => {
                    expect(1).toEqual(comp.getState().count);
                })
                .then(done, done);
        });

        it('dispatches to the next middleware', () => {
            const el = document.createElement('div');
            const log = [];
            const loggerMiddleware = store => next => action => {
                log.push(action);
                next(action);
            };
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(thunkMiddleware, loggerMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch(dispatch => dispatch({ type: 'inc' }));
            expect(JSON.stringify(log)).toEqual(
                JSON.stringify([{ type: 'inc' }])
            );
            expect(1).toEqual(log.length);
        });
    });

    describe('promise middleware', function() {
        it('accepts a promise', function(done) {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(promiseMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch(
                new Promise(resolve => {
                    resolve({ type: 'inc' });
                })
            )
                .then(() => {
                    expect(1).toEqual(comp.getState().count);
                })
                .then(done, done);
            expect(0).toEqual(comp.getState().count);
        });

        it('ignores rejected promises', function(done) {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(promiseMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch(
                new Promise((resolve, reject) => {
                    reject({ reason: 'just testing' });
                })
            )
                .then(() => {
                    expect(1).toEqual(comp.getState().count);
                })
                .catch(err => {
                    expect(err.reason).toEqual('just testing');
                })
                .then(done, done);
            expect(0).toEqual(comp.getState().count);
        });
    });

    describe('when combined', function() {
        it('accepts a promise', function(done) {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(promiseMiddleware, thunkMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch(
                new Promise(resolve => {
                    resolve({ type: 'inc' });
                })
            )
                .then(() => {
                    expect(1).toEqual(comp.getState().count);
                })
                .then(done, done);
            expect(0).toEqual(comp.getState().count);
        });

        it('ignores rejected promises', function(done) {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(promiseMiddleware, thunkMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch(
                new Promise((resolve, reject) => {
                    reject({ reason: 'just testing' });
                })
            )
                .then(() => {
                    expect(1).toEqual(comp.getState().count);
                })
                .catch(err => {
                    expect(err.reason).toEqual('just testing');
                })
                .then(done, done);
            expect(0).toEqual(comp.getState().count);
        });

        it('accepts a function', function() {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(promiseMiddleware, thunkMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch(dispatch => {
                dispatch({ type: 'inc' });
                dispatch({ type: 'dec' });
                dispatch({ type: 'inc' });
            });
            expect(1).toEqual(comp.getState().count);
        });

        it('provides access to state', function() {
            const el = document.createElement('div');
            const Component = createComponent(
                tpl,
                countingReducer,
                applyMiddleware(promiseMiddleware, thunkMiddleware)
            );
            const comp = new Component(el);
            comp.dispatch((dispatch, getState) => {
                dispatch({ type: 'inc' });
                expect(1).toEqual(getState().count);
                dispatch({ type: 'dec' });
                expect(0).toEqual(getState().count);
                dispatch({ type: 'inc' });
                expect(1).toEqual(getState().count);
            });
            expect(1).toEqual(comp.getState().count);
        });
    });
});
