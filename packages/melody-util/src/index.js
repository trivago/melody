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
/**
 * Wraps a series of redux compatible middlewares into a Melody Component Mixin.
 *
 * @param {...Function} middlewares
 */
export const applyMiddleware = (...middlewares) => proto => {
    const componentDidInitialize = proto.componentDidInitialize;
    return {
        componentDidInitialize() {
            componentDidInitialize.call(this);
            // and dispatch
            let next = this.dispatch;
            let i = middlewares.length;
            this.dispatch = action => {
                return next(action);
            };
            while (i--) {
                const curr = middlewares[i];
                if (curr) {
                    next = curr(this)(next);
                }
            }
        },
    };
};

/**
 * Wraps an object into a reducer function so that each property of the object should
 * correspond to the action type that it handles.
 *
 * @param {Object} pattern The object that should be used to delegate to the correct reducer.
 * @param {Object?} initialState An optional state that should be used on initialization.
 */
export const createActionReducer = (pattern, initialState) => (
    state,
    action
) => {
    if (action.type && pattern[action.type]) {
        return (
            (0, pattern[action.type])(state || initialState, action) ||
            state ||
            initialState
        );
    }
    return state || initialState;
};

const mapDispatchToStateWithProps = fn => (state, action) => {
    if (action.type === 'MELODY/RECEIVE_PROPS') {
        return Object.assign(
            {},
            state,
            fn(action.meta.dispatch, action.payload)
        );
    }
    return state;
};

const DISPATCH_PROPS = 'MELODY/DISPATCH_TO_STATE';

const mapDispatchToState = fn => (state, action) => {
    if (action.type === 'MELODY/RECEIVE_PROPS') {
        if (state && !state[DISPATCH_PROPS]) {
            const dispatchMap = fn(action.meta.dispatch);
            return Object.assign({}, state, dispatchMap, {
                'MELODY/DISPATCH_TO_STATE': dispatchMap,
            });
        }
    }
    return state;
};

/**
 * Returns a function that will dispatch the return value of the given action creator
 * to the given dispatch function.
 *
 * Can be used to create an action that is always dispatched to the same store or component.
 *
 * @param {Function} action
 * @param {Function} dispatch
 */
export const bindActionToDispatch = (action, dispatch) => (...args) =>
    dispatch(action(...args));

const wrapObjectToDispatch = dispatchToState => dispatch => {
    const keys = Object.keys(dispatchToState);
    const mappedDispatchers = {};
    let i = 0;
    for (const len = keys.length; i < len; i++) {
        const actionCreator = dispatchToState[keys[i]];
        if (typeof actionCreator === 'function') {
            mappedDispatchers[keys[i]] = bindActionToDispatch(
                actionCreator,
                dispatch
            );
        }
    }
    return mappedDispatchers;
};

/**
 * Returns a function that can be used to inject dispatchers into the state
 * of a component.
 *
 * Usually used together with [reduce-reducers](https://github.com/acdlite/reduce-reducers).
 *
 * @param {Function|Object} dispatchToState The dispatch reducer
 */
export function dispatchToState(dispatchToState) {
    if (typeof dispatchToState === 'object') {
        return mapDispatchToState(wrapObjectToDispatch(dispatchToState));
    }
    const dependsOnProps = dispatchToState.length === 2;
    if (dependsOnProps) {
        return mapDispatchToStateWithProps(dispatchToState);
    } else {
        return mapDispatchToState(dispatchToState);
    }
}

const defaultReducer = (state = {}, { type, payload }) => {
    if (type === RECEIVE_PROPS) {
        return Object.assign({}, state, payload);
    }
    return state;
};

/**
 * Returns a reducer that exposes certain functions of a component to the state
 *
 * @param {Array} list List of property names that should be exposed to the state
 * @param {Function} reducer Component reducer that will be wrapped
 */
export function exposeToState(list = [], reducer = defaultReducer) {
    return (state, action) => {
        const { type, meta } = action;
        const result = reducer(state, action);

        // Check if functions have already been merged to state;
        let hasExpose = true;
        for (let i = 0, l = list.length; i < l; i++) {
            const key = list[i];
            if (!result[key]) {
                hasExpose = false;
                break;
            }
        }

        if (hasExpose || type !== RECEIVE_PROPS) {
            return result;
        }

        const expose = list.reduce((acc, key) => {
            const prop = meta[key];
            if (!prop) {
                throw new Error(
                    'Property `' + key + '` was not found on the component.'
                );
            }
            if (typeof prop !== 'function') {
                throw new Error(
                    'Property `' +
                        key +
                        '` is not a function. Only functions can be exposed to the state.'
                );
            }
            acc[key] = prop.bind(meta);
            return acc;
        }, {});

        return Object.assign({}, result, expose);
    };
}
