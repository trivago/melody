/**
 * Copyright 2018 trivago N.V.
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

import { HOOK_TYPE_USE_STATE } from '../constants';
import { enterHook } from '../util/hooks';

export const useState = initialState => {
    const currentComponent = enterHook(HOOK_TYPE_USE_STATE);
    const { hooksPointer, hooks, state, setState } = currentComponent;

    if (currentComponent.isCollectingHooks) {
        const setter = value => setState(hooksPointer, value);
        const value =
            typeof initialState === 'function' ? initialState() : initialState;
        hooks.push([HOOK_TYPE_USE_STATE, setter]);
        state[hooksPointer] = value;
        return [value, setter];
    }
    const setter = hooks[hooksPointer][1];
    const value = state[hooksPointer];
    return [value, setter];
};
