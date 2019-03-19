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

import { useCallback } from './useCallback';
import { useState } from './useState';
import { useEffect } from './useEffect';
import { useRef } from './useRef';
import { shallowEqual } from '../util/shallowEqual';
import { isStore } from '../util/isStore';

// We use a lot of selectors that access props when used with `melody-redux` e.g:
// const selector = (state, props) => state[props.id]
// These type of selectors don't make sense with melody-hooks
// therefore we warn the developer.
let props;
if (process.env.NODE_ENV !== 'production') {
    const target = {};
    const handler = {
        get: () => {
            throw new Error(
                'useStore: You tried to access `props` in a selector. ' +
                    '`props` cannot be passed to selectors. ' +
                    'Instead use properties from outside of the selector function'
            );
        },
    };
    props = new Proxy(target, handler);
}

/**
 * Runs `selector` on `store.getState`. Does a shallow equal compare
 * against `state`. If states are equal it returns the passed state, if not it returns the new one.
 * @param {Object} state The current state
 * @param {Function} selector A selector function
 * @param {Store} store A redux store instance
 */
const selectState = (state, selector, store) => {
    const stateNext = selector(store.getState(), props);

    // We use a lot of selector creators with `melody-redux` in our code base, e.g:
    // const createMapStateToProps = () => createSelector(...)
    // These type of selectors don't make sense with melody-hooks
    // therefore we warn the developer.
    if (process.env.NODE_ENV !== 'production') {
        if (typeof stateNext === 'function') {
            throw new Error(
                'useStore: the selector that was passed to useStore returned a function. ' +
                    'This might be because you tried to pass a selector creator. ' +
                    'This is not allowed with melody-hooks'
            );
        }
    }

    if (shallowEqual(state, stateNext)) {
        return state;
    }
    return stateNext;
};

/**
 * Subscribes to the given store. When the selected state changes,
 * it sets `stateRef.current` to the new value and calls `onChange`.
 * Returns an unsubscribe function
 * @param {Store} store A redux store instance
 * @param {Ref} stateRef A melody-hooks ref of the current state
 * @param {Ref} selectorRef A melody-hooks ref of the current selector
 * @param {Function} onChange called when the selected state changes
 */
const subscribeToStore = (store, stateRef, selectorRef, onChange) =>
    store.subscribe(() => {
        const stateRefCurrent = stateRef.current;
        const stateNext = selectState(
            stateRefCurrent,
            selectorRef.current,
            store
        );
        if (stateNext !== stateRefCurrent) {
            stateRef.current = stateNext;
            onChange();
        }
    });

const defaultSelector = state => state;

/**
 * A melody hook for subscribing to a redux store.
 *
 * @param {Store} store A redux store instance
 * @param {Function} selector A selector function
 */
export const useStore = (store, selector = defaultSelector) => {
    if (process.env.NODE_ENV !== 'production') {
        if (!isStore(store)) {
            throw new Error(
                'useStore: expected first argument to be a redux store, ' +
                    'instead received ' +
                    typeof store
            );
        }
        if (typeof selector !== 'function') {
            throw new Error(
                'useStore: expected second argument to be a selector function, ' +
                    'instead received ' +
                    typeof selector
            );
        }
    }
    // Holds the current selected state
    const stateRef = useRef();

    // Reference to the current selector, used inside the useEffect hook.
    // This way we don't need to resubscribe when selector changes
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    // Force update is used within the store subscription, whenever
    // the selected state changed due to a store update, we force
    // an update
    const [, setN] = useState(0);
    const forceUpdate = useCallback(() => setN(n => n + 1), []);

    stateRef.current = selectState(stateRef.current, selector, store);

    useEffect(
        () => subscribeToStore(store, stateRef, selectorRef, forceUpdate),
        [store]
    );

    return stateRef.current;
};
