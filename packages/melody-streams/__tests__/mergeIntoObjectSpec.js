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

import { mergeIntoObject } from '../src/operators/mergeIntoObject';
import {
    applyGradualyAndComplete,
    createSubjects,
    next,
    complete,
} from './util/testHelpers';

describe('attachEvent', () => {
    it('should connect to stream and emit to object', async () => {
        const [subj1] = createSubjects(1);
        const stream = mergeIntoObject(subj1);
        expect(
            applyGradualyAndComplete(stream, next(subj1), ['1', '2', '3'])
        ).resolves.toEqual([
            {
                '0': '1',
            },
            {
                '0': '2',
            },
            {
                '0': '3',
            },
        ]);
        // We need to individually complete all the subjecs, otherwise combined will not complete itself.
        complete(subj1);
    });

    it('should connect to several streams and emit object by combineLatest', () => {
        const subjects = createSubjects(2);
        const stream = mergeIntoObject(...subjects);
        expect(
            applyGradualyAndComplete(stream, next(...subjects), [
                ['1', '2', '3'],
                ['foo', 'bar', 'baz'],
            ])
        ).resolves.toEqual([
            {
                '0': 'f',
                '1': 'o',
                '2': 'o',
            },
            {
                '0': 'b',
                '1': 'a',
                '2': 'r',
            },
            {
                '0': 'b',
                '1': 'a',
                '2': 'z',
            },
        ]);
        // We need to individually complete all the subjecs, otherwise combined will not complete itself.
        complete(...subjects);
    });
});
