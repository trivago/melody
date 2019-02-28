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

import { mergeObject } from '../src/operators/mergeObject';
import {
    applyGradualyAndComplete,
    next,
    complete,
    createSubjects,
} from './util/testHelpers';
import { isObservable } from 'rxjs';

describe('attachEvent', () => {
    it('should take simple objects and turn into stream', async () => {
        const spec = {
            foo: 'bar',
            biz: 'baz',
            arr: [1, 2, 3, 4],
        };
        const stream = mergeObject(spec);
        applyGradualyAndComplete(stream, () => {}, []).then(result => {
            expect(isObservable(stream)).toBe(true);
            expect(result).toEqual([
                { arr: [1, 2, 3, 4], biz: 'baz', foo: 'bar' },
            ]);
        });
    });

    it('should subscribe to nested observables and turn into stream', async () => {
        const [subj, subj2] = createSubjects(2);
        const spec = {
            foo: 'bar',
            biz: 'baz',
            arr: [1, 2, 3, 4],
            subj,
            subj2,
        };
        const stream = mergeObject(spec);
        applyGradualyAndComplete(mergeObject(spec), next(subj, subj2), [
            [10, 20],
            ['foo', 'bar'],
        ]).then(result => {
            expect(isObservable(stream)).toBe(true);
            expect(result).toEqual([
                {
                    arr: [1, 2, 3, 4],
                    biz: 'baz',
                    foo: 'bar',
                    subj: 20,
                    subj2: 'foo',
                },
                {
                    arr: [1, 2, 3, 4],
                    biz: 'baz',
                    foo: 'bar',
                    subj: 20,
                    subj2: 'bar',
                },
            ]);
        });
        // We need to individually complete all the subjecs, otherwise combined will not complete itself.
        complete(subj, subj2);
    });
});
