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

import { combineRefs, withElement } from '../src';
import { applyGradualyAndComplete, next } from './util/testHelpers';
import { Subject } from 'rxjs';

const wrappedWithElement = obs => withElement(el => obs);

describe('combineRefs', () => {
    it('should not update subjects when combinedRefs was not executed after being attached to handlers', async () => {
        const sink = new Subject();
        const [refHandler1, subj1] = wrappedWithElement(sink);
        const [refHandler2, subj2] = wrappedWithElement(sink);
        const combinedRefs = combineRefs(refHandler1, refHandler2);
        expect(typeof combinedRefs).toBe('function');
        applyGradualyAndComplete([subj1, subj2], next(sink), [
            'foo',
            'bar',
        ]).then(([stream1, stream2]) => {
            expect(stream1).toEqual([]);
            expect(stream2).toEqual([]);
        });
    });
    it('should combine refs and attach them to el bound to same stream while subjects should have same values', async () => {
        const sink = new Subject();
        const el = document.createElement('div');
        const [refHandler1, subj1] = wrappedWithElement(sink);
        const [refHandler2, subj2] = wrappedWithElement(sink);
        const combinedRefs = combineRefs(refHandler1, refHandler2);
        expect(typeof combinedRefs).toBe('function');
        const combinedRefHandlers = combinedRefs(el);
        expect(typeof combinedRefHandlers).toBe('object');
        expect(combinedRefHandlers).toHaveProperty('unsubscribe');

        applyGradualyAndComplete([subj1, subj2], next(sink), [
            'foo',
            'bar',
        ]).then(([stream1, stream2]) => {
            expect(stream1).toEqual(['foo', 'bar']);
            expect(stream2).toEqual(['foo', 'bar']);
        });
    });
    it('should combine refs and attach them to el bound to different strem while subjects should have different values', async () => {
        const sink1 = new Subject();
        const sink2 = new Subject();
        const el = document.createElement('div');
        const [refHandler1, subj1] = wrappedWithElement(sink1);
        const [refHandler2, subj2] = wrappedWithElement(sink2);
        const combinedRefs = combineRefs(refHandler1, refHandler2);
        expect(typeof combinedRefs).toBe('function');
        const combinedRefHandlers = combinedRefs(el);
        expect(typeof combinedRefHandlers).toBe('object');
        expect(combinedRefHandlers).toHaveProperty('unsubscribe');

        applyGradualyAndComplete(
            [subj1, subj2],
            [...next(sink1), ...next(sink2)],
            [['foo', 'bar'], ['biz', 'baz']]
        ).then(([stream1, stream2]) => {
            expect(stream1).toEqual(['foo', 'bar']);
            expect(stream2).toEqual(['biz', 'baz']);
        });
    });
});
