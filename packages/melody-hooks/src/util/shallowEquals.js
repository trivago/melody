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

const hasOwn = Object.prototype.hasOwnProperty;

export const shallowEquals = (a, b) => {
    if (a === b) {
        return true;
    }

    if (!a || !b) {
        return false;
    }

    const keyOfA = Object.keys(a),
        keysOfB = Object.keys(b);

    if (keyOfA.length !== keysOfB.length) {
        return false;
    }

    for (let i = 0; i < keyOfA.length; i++) {
        if (!hasOwn.call(b, keyOfA[i]) || a[keyOfA[i]] !== b[keyOfA[i]]) {
            return false;
        }
    }

    return true;
};

export const shallowEqualsScalar = (a, b) => {
    const at = typeof a;
    const bt = typeof b;
    if (at !== bt) return false;
    if (
        at === 'boolean' ||
        at === 'string' ||
        at === 'number' ||
        at === 'function'
    ) {
        return a === b;
    }
    return shallowEquals(a, b);
};

export const shallowEqualsArray = (a, b) => {
    const l = a.length;
    if (l !== b.length) return false;

    for (let i = 0; i < l; i++) {
        if (a[i] !== b[i]) return false;
    }

    return true;
};
