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
import type { Component, ReceivePropsAction } from './index.js.flow';

/**
 * The `type` of the action which is triggered when the properties of
 * a component are changed.
 *
 * Actions of this type follow the "Standard Flux Action" pattern. They have
 * a property `type`, equal to this value, and a property `payload` which is
 * an object containing the new properties.
 *
 * @type {string}
 */
export const RECEIVE_PROPS = 'MELODY/RECEIVE_PROPS';

/**
 * An Action Creator which creates an {@link RECEIVE_PROPS} action.
 * @param payload The new properties
 * @param meta The component which will receive new properties
 * @returns ReceivePropsAction
 */
export function setProps(payload: Object, meta: Component): ReceivePropsAction {
    return {
        type: RECEIVE_PROPS,
        payload,
        meta,
    };
}
