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

import {
    HOOK_TYPE_USE_EFFECT,
    HOOK_TYPE_USE_MUTATION_EFFECT,
} from '../constants';
import { enterHook } from '../util/hooks';
import { shallowEqualsArray } from '../util/shallowEquals';

const createEffectHook = type => (callback, inputs) => {
    const currentComponent = enterHook(type);
    const { hooksPointer, hooks } = currentComponent;

    const inputsNext =
        inputs !== undefined && inputs !== null ? inputs : [callback];

    if (currentComponent.isCollectingHooks) {
        const dirty = true;
        const unsubscribe = null;
        hooks.push([type, callback, inputsNext, dirty, unsubscribe]);
        return;
    }

    const hook = hooks[hooksPointer];
    const inputsPrev = hook[2];
    const dirty = !shallowEqualsArray(inputsPrev, inputsNext);

    if (dirty) {
        hook[1] = callback;
    }
    hook[2] = inputsNext;
    hook[3] = dirty;
};

export const useEffect = createEffectHook(HOOK_TYPE_USE_EFFECT);

export const useEffectOnce = callback => useEffect(callback, []);

export const useMutationEffect = createEffectHook(
    HOOK_TYPE_USE_MUTATION_EFFECT
);
