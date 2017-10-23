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
import {
    isNumber,
    random as rand,
    min as lMin,
    max as lMax,
    values,
    upperFirst,
    isFunction,
    isObject,
} from 'lodash';

const MAX_SAFE_INTEGER =
    'MAX_SAFE_INTEGER' in Number ? Number.MAX_SAFE_INTEGER : 9007199254740991;

export function random(
    iterable: Array | Number | String = MAX_SAFE_INTEGER
): any {
    if (isNumber(iterable)) {
        return rand(0, iterable);
    }
    return iterable[rand(0, iterable.length - 1)];
}

export function min(iterable, ...additional) {
    if (additional.length) {
        return lMin([iterable, ...additional]);
    }
    if (Array.isArray(iterable)) {
        return lMin(iterable);
    }
    return lMin(values(iterable));
}

export function max(iterable, ...additional) {
    if (additional.length) {
        return lMax([iterable, ...additional]);
    }
    if (Array.isArray(iterable)) {
        return lMax(iterable);
    }
    return lMax(values(iterable));
}

export function cycle(data, index) {
    return data[index % data.length];
}

export function attribute(obj, prop, args) {
    if (Array.isArray(obj)) {
        return obj[prop];
    }
    if (isObject(obj)) {
        if (obj.hasOwnProperty(prop)) {
            return isFunction(obj[prop]) ? obj[prop](...args) : obj[prop];
        }
        const ucProp = upperFirst(prop);
        if (isFunction(obj['get' + ucProp])) {
            return obj['get' + ucProp]();
        }
        if (isFunction(obj['is' + ucProp])) {
            return obj['is' + ucProp]();
        }
    }
    return undefined;
}
