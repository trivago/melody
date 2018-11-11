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

import { HOOK_TYPE_USE_REF } from '../constants';
import { enterHook } from '../util/hooks';

const refCounter = Symbol();

const createRef = initialValue => {
    const ref = el => {
        if (el !== ref.current) {
            ref[refCounter]++;
        }
        ref.current = el;
        return {
            unsubscribe() {
                if (!ref[refCounter]) {
                    ref.current = undefined;
                }
                ref[refCounter]--;
            },
        };
    };
    ref.current = initialValue;
    ref[refCounter] = -1;
    return ref;
};

// Only for testing purposes
export const getRefCounter = ref => ref[refCounter];

export const useRef = initialValue => {
    const currentComponent = enterHook(HOOK_TYPE_USE_REF);
    const { hooks, hooksPointer } = currentComponent;

    if (currentComponent.isCollectingHooks) {
        const ref = createRef(initialValue);
        hooks.push([HOOK_TYPE_USE_REF, ref]);
        return ref;
    }

    return hooks[hooksPointer][1];
};
