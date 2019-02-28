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

import { combine } from '../src';
import {
    applyGradualyAndComplete,
    createSubjects,
    next,
    complete,
} from './util/testHelpers';

describe('attachEvent', () => {
    it('should combine streams and objects and emit over time', async () => {
        const subjects = createSubjects(3);
        const obj1 = {
            foo: 'bar',
            arr: [1, 2, 3],
        };
        const obj2 = {
            biz: 'baz',
            12: 22,
        };
        const combined = combine(...subjects, obj1, obj2);
        expect(
            applyGradualyAndComplete(combined, next(...subjects), [
                ['fooSubj1', 'barSubj1'],
                ['fooSubj2', 'barSubj2'],
                ['fooSubj3', 'barSubj3'],
            ])
        ).resolves.toEqual([
            {
                '0': 'f',
                '1': 'o',
                '12': 22,
                '2': 'o',
                '3': 'S',
                '4': 'u',
                '5': 'b',
                '6': 'j',
                '7': '3',
                arr: [1, 2, 3],
                biz: 'baz',
                foo: 'bar',
            },
            {
                '0': 'b',
                '1': 'a',
                '12': 22,
                '2': 'r',
                '3': 'S',
                '4': 'u',
                '5': 'b',
                '6': 'j',
                '7': '3',
                arr: [1, 2, 3],
                biz: 'baz',
                foo: 'bar',
            },
        ]);
        // We need to individually complete all the subjecs, otherwise combined will not complete itself.
        complete(...subjects);
    });
});
