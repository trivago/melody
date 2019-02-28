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

import { withElement } from '../src';
import { applyGradualyAndComplete, next } from './util/testHelpers';
import { Subject, isObservable } from 'rxjs';

describe('withElement', () => {
    it('should return a refHandler and subject that connects the refstream to the return subject', () => {
        const sink = el => new Subject();
        const [refHandler, subj] = withElement(sink);
        const exec = refHandler();
        expect(typeof refHandler).toBe('function');
        expect(isObservable(subj)).toBe(true);
        expect(
            applyGradualyAndComplete(subj, next(exec), ['foo', 'bar'])
        ).resolves.toEqual(['foo', 'bar']);
    });
    it('should return an empty subject as a stream if no initial value has been given', () => {
        const sink = el => new Subject();
        const subj = withElement(sink)[1];
        expect(isObservable(subj)).toBe(true);
        expect(applyGradualyAndComplete(subj, () => {}, [])).resolves.toEqual(
            []
        );
    });
    it('should return an non empty subject (BehaviorSubject) as a stream if initial value has been given', () => {
        const sink = el => new Subject();
        const subj = withElement(sink, 'foo')[1];
        expect(isObservable(subj)).toBe(true);
        expect(applyGradualyAndComplete(subj, () => {}, [])).resolves.toEqual([
            'foo',
        ]);
    });
});
