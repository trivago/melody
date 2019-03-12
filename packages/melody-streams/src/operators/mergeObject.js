/**
 * Copyright 2019 trivago N.V.
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

import { isObservable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { toPairs } from 'lodash';
import { mergeIntoObject } from './mergeIntoObject';

export const mergeObject = spec => {
    const pairs = toPairs(spec);
    const observables = pairs.map(([key, value]) => {
        if (isObservable(value)) {
            return value.pipe(
                map(val => ({
                    [key]: val,
                }))
            );
        }
        return of({
            [key]: value,
        });
    });
    return mergeIntoObject(...observables);
};
