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

import { createState } from '../src';
import { applyGradualyAndComplete } from './util/testHelpers';

describe('createState', () => {
    it('should create an Observable from initial data', () => {
        const [count] = createState(0);
        expect(applyGradualyAndComplete(count)).resolves.toEqual([0]);
    });

    it('should mutate state by using setter', async () => {
        const [count, setCount] = createState(0);
        expect(
            applyGradualyAndComplete(count, setCount, [1, 2, 3])
        ).resolves.toEqual([0, 1, 2, 3]);
    });

    it('should get correct state by using getter', () => {
        const [count, setCount, getCount] = createState(0);
        expect(getCount()).toBe(0);
        expect(
            applyGradualyAndComplete(count, setCount, [33, 2, 3])
        ).resolves.toEqual([0, 33, 2, 3]);
        expect(getCount()).toBe(3);
    });
});
