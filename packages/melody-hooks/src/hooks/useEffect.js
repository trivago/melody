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

import { HOOK_TYPE_USE_EFFECT } from '../constants';
import { enterHook } from '../util/hooks';
import { shallowEqualsArray } from '../util/shallowEquals';

export const useEffect = (callback, inputs) => {
    const currentComponent = enterHook(HOOK_TYPE_USE_EFFECT);
    const { hooksPointer, hooks } = currentComponent;

    if (currentComponent.isCollectingHooks) {
        const dirty = true;
        const unsubscribe = null;
        hooks.push([
            HOOK_TYPE_USE_EFFECT,
            callback,
            inputs,
            dirty,
            unsubscribe,
        ]);
        return;
    }

    const dataPrev = hooks[hooksPointer][2];
    const dirty =
        !inputs || (inputs.length && !shallowEqualsArray(dataPrev, inputs));

    if (dirty) {
        hooks[hooksPointer][1] = callback;
    }
    hooks[hooksPointer][2] = inputs;
    hooks[hooksPointer][3] = dirty;
};

const DO_NOT_UPDATE = [];

export const useEffectOnce = callback => {
    useEffect(callback, DO_NOT_UPDATE);
};
