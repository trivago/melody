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

import { attachEvent } from '../src';
import { testWith } from './util/testWith';

const clickEvent = new MouseEvent('click');
const mouseEnterEvent = new MouseEvent('mouseenter');

clickEvent.toJSON = () => ({ type: 'MouseClick' });
mouseEnterEvent.toJSON = () => ({ type: 'MouseEnter' });
const dispatchClick = el => () => el.dispatchEvent(clickEvent);
const dispatchMouseEnter = el => () => el.dispatchEvent(mouseEnterEvent);

describe('attachEvent', () => {
    it('should attach a click handler', async () => {
        const el = document.createElement('div');
        const [refHandler, subj] = attachEvent('click');
        refHandler(el);
        testWith(subj, dispatchClick(el), [undefined, undefined, undefined]);
    });

    it('should attach multiple handlers', async () => {
        const el = document.createElement('div');
        const [refHandler, subj] = attachEvent('click', 'mouseenter');
        refHandler(el);
        testWith(
            subj,
            [dispatchClick(el), dispatchMouseEnter(el)],
            [undefined, undefined, undefined]
        );
    });
});
