/**
 * Copyright 2015 The Incremental DOM Authors.
 * Copyright 2017 trivago N.V.
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

import { patch, elementVoid, skipNode } from '../src';

describe('skip', () => {
    let container;
    let firstChild;
    let lastChild;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = '<div></div><span></span>';

        firstChild = container.firstChild;
        lastChild = container.lastChild;

        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should keep nodes that were skipped at the start', () => {
        patch(container, () => {
            skipNode();
            elementVoid('span');
        });

        expect(container.firstChild).toEqual(firstChild);
        expect(container.lastChild).toEqual(lastChild);
    });

    it('should keep nodes that were skipped', () => {
        patch(container, () => {
            elementVoid('div');
            skipNode();
        });

        expect(container.lastChild).toEqual(lastChild);
    });
});
