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
 * Utility function to add capabilities to an object. Such a capability
 * is usually called a "mixin" and can be either
 *
 * - an object that is merged into the prototype of `target`
 * - a function taking the prototype and optionally returning an object which
 *   is merged into the prototype
 * - a falsy value (`false`, `null` or `undefined`) which is ignored.
 *   This is useful for adding a capability optionally.
 *
 * @param target The constructor of a class
 * @param {...Mixin} mixins The mixins applied to the `target`
 * @returns {*}
 */
export function mixin(target) {
    var obj = typeof target === 'function' ? target.prototype : target;
    // If implementation proves to be too slow, rewrite to use a proper loop
    for (let i = 1, len = arguments.length; i < len; i++) {
        const mixin = arguments[i];
        mixin &&
            Object.assign(
                obj,
                typeof mixin === 'function' ? mixin(obj) : mixin
            );
    }
    return target;
}
