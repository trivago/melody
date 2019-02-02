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

import { useRef } from './useRef';
import { usePrevious } from './usePrevious';
import { shallowEqual } from '../util/shallowEqual';
import { isStore } from '../util/isStore';

const bindActionCreator = (actionCreator, dispatch) =>
    function() {
        return dispatch(actionCreator.apply(this, arguments));
    };

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call.
 * @param {Function|Object} actionCreators An object whose values are action creator functions
 * @param {Function} dispatch The `dispatch` function available on your redux store.
 */
const bindActionCreators = (actionCreators, dispatch) => {
    if (typeof actionCreators === 'function') {
        return bindActionCreator(actionCreators, dispatch);
    }

    const keys = Object.keys(actionCreators);
    const boundActionCreators = {};
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const actionCreator = actionCreators[key];
        if (typeof actionCreator === 'function') {
            boundActionCreators[key] = bindActionCreator(
                actionCreator,
                dispatch
            );
        }
    }
    return boundActionCreators;
};

/**
 * A melody hook to bind `actionCreators` to your redux store's dispatch function
 *
 * @param {Store} store A redux store instance
 * @param {Function|Object} actionCreators A single function or an object of functions
 * that get bound to the store's dispatch function
 */
export const useActions = (store, actionCreators) => {
    if (process.env.NODE_ENV !== 'production') {
        if (!isStore(store)) {
            throw new Error(
                `useActions: expected first argument to be a redux store, instead received ${typeof store}`
            );
        }
        if (
            (typeof actionCreators !== 'function' &&
                typeof actionCreators !== 'object') ||
            actionCreators === null
        ) {
            throw new Error(
                `useActions: expected second argument to be an object or a function, instead received ${
                    actionCreators === null ? 'null' : typeof actionCreators
                }. `
            );
        }
    }

    const boundActionCreatorsRef = useRef();
    const actionCreatorsPrev = usePrevious(actionCreators);

    if (
        !actionCreatorsPrev ||
        !shallowEqual(actionCreators, actionCreatorsPrev)
    ) {
        boundActionCreatorsRef.current = bindActionCreators(
            actionCreators,
            store.dispatch
        );
    }

    return boundActionCreatorsRef.current;
};
