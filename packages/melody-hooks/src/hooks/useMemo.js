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

import { HOOK_TYPE_USE_MEMO } from '../constants';
import { getCurrentComponent, enterHook } from '../util/hooks';
import { shallowEqualsArray } from '../util/shallowEquals';

export const useMemo = (getter, inputs) => {
    enterHook();
    const currentComponent = getCurrentComponent();
    const { hooksPointer, hooks } = currentComponent;

    if (currentComponent.isCollectingHooks) {
        const value = getter();
        hooks.push([HOOK_TYPE_USE_MEMO, value, inputs]);
        return value;
    }

    const hook = hooks[hooksPointer];
    const valuePrev = hook[1];
    const inputsPrev = hook[2];
    const dirty =
        inputs && inputs.length && !shallowEqualsArray(inputsPrev, inputs);

    if (!dirty) return valuePrev;

    // Update value
    const value = getter();
    hook[1] = value;
    hook[2] = inputs;
    return value;
};
