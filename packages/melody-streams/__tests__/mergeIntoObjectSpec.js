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

import { mergeIntoObject } from '../src';
import { testWith, createSubjects, next, complete } from './util/testHelpers';

describe('attachEvent', () => {
    it('should connect to stream and emit to object', async () => {
        const [subj1] = createSubjects(1);
        const stream = mergeIntoObject(subj1);
        testWith(stream, next(subj1), ['1', '2', '3']);
        // Let mergeIntoObject complete by completing it streams
        complete(subj1);
    });

    it('should connect to several streams and emit object by combineLatest', () => {
        const subjects = createSubjects(2);
        const stream = mergeIntoObject(...subjects);
        testWith(stream, next(...subjects), [
            ['1', '2', '3'],
            ['foo', 'bar', 'baz'],
        ]);
        // Let mergeIntoObject complete by completing it streams
        complete(...subjects);
    });
});
