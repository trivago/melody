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
import type { Reducer, Action } from './index.js.flow';

export type State = (action: ?Action) => Object;

/**
 * A simple state container which is modified through actions
 * by using a reducer.
 *
 * When the returned state function is invoked without parameters,
 * it returns the current state.
 *
 * If the returned function is invoked with an action, the reducer is executed
 * and its return value becomes the new state.
 *
 * @param reducer
 * @returns {Function}
 */
export function createState(reducer: Reducer): State {
    let state = reducer(undefined, {
        type: 'MELODY/@@INIT',
    });

    return function store(action: ?Action): Object {
        if (action) {
            state = reducer(state, action) || state;
        }
        return state;
    };
}
