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
import { enterHook, getCurrentComponent } from '../util/hooks';
import { shallowEqualsArray } from '../util/shallowEquals';

export const useEffect = (callback, shouldUpdateOrDataArray) => {
    enterHook();
    const currentComponent = getCurrentComponent();
    const { hooksPointer, hooks } = currentComponent;

    if (!currentComponent.isMounted) {
        const dirty = true;
        const unsubscribe = null;
        hooks.push([
            HOOK_TYPE_USE_EFFECT,
            callback,
            shouldUpdateOrDataArray,
            dirty,
            unsubscribe,
        ]);
        return;
    }

    const dataPrev = hooks[hooksPointer][2];
    const dirty =
        shouldUpdateOrDataArray === true ||
        (shouldUpdateOrDataArray &&
            shouldUpdateOrDataArray.length &&
            !shallowEqualsArray(dataPrev, shouldUpdateOrDataArray));

    hooks[hooksPointer][2] = shouldUpdateOrDataArray;
    hooks[hooksPointer][3] = dirty;
};
