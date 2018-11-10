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

let currentComponent = null;

export const setCurrentComponent = c => {
    if (currentComponent) {
        throw new Error('Cannot override currentComponent');
    }
    currentComponent = c;
};

export const unsetCurrentComponent = () => {
    currentComponent = null;
};

export const enterHook = type => {
    if (!type) {
        throw new Error('Please provide a hook type when calling `enterHook`');
    }
    if (!currentComponent) {
        throw new Error('Cannot use hooks outside of component functions');
    }
    currentComponent.hooksPointer += 1;

    // Check if hook types differ and throw if so.
    if (!currentComponent.isCollectingHooks) {
        const hooks = currentComponent.hooks;
        if (hooks[currentComponent.hooksPointer][0] !== type) {
            throw new Error(
                'The order of hooks changed. This breaks the internals ' +
                    'of the component. It is not allowed to call hooks inside ' +
                    'loops, conditions, or nested functions'
            );
        }
    }

    return currentComponent;
};
