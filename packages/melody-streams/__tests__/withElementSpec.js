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
import { testWith } from './util/testWith';
import { Subject } from 'rxjs';

describe('withElement', () => {
    it('should return a refHandler and subject that connects the refstream to the return subject', async () => {
        const sink = el => new Subject();
        const [refHandler, subj] = withElement(sink);
        const exec = refHandler();
        testWith(subj, exec.next.bind(exec), ['foo', 'bar']);
    });
});
