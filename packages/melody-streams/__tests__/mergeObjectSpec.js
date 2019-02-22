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

import { mergeObject } from '../src';
import { testWith, next, complete, createSubjects } from './util/testHelpers';

describe('attachEvent', () => {
    it('should take simple objects and turn into stream', async () => {
        const spec = {
            foo: 'bar',
            biz: 'baz',
            arr: [1, 2, 3, 4],
        };
        testWith(mergeObject(spec), () => {}, []);
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

        testWith(mergeObject(spec), next(subj, subj2), [
            [10, 20],
            ['foo', 'bar'],
        ]);
        complete(subj, subj2);
    });
});
