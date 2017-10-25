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
/**
 * Creates a subcontext for a given context and assigns custom values to it.
 * @param parent The parent context
 * @param customValues Any custom values that should be assigned to the child context
 * @returns A new child context
 */
export function createSubContext(
    parent: Object,
    customValues?: Object
): Object {
    const subContext = Object.create(parent);
    if (customValues) {
        Object.assign(subContext, customValues);
    }
    return subContext;
}
