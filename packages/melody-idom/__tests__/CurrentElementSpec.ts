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

import {
    patch,
    elementOpen,
    elementOpenStart,
    elementOpenEnd,
    elementClose,
    elementVoid,
    currentElement,
} from '../src';

describe('currentElement', () => {
    let container;
    let el;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        el = null;
    });

    it('should return the element from elementOpen', () => {
        patch(container, () => {
            elementOpen('div');
            el = currentElement();
            elementClose('div');
        });
        expect(el).toEqual(container.childNodes[0]);
    });

    it('should return the element from elementOpenEnd', () => {
        patch(container, () => {
            elementOpenStart('div');
            elementOpenEnd('div');
            el = currentElement();
            elementClose('div');
        });

        expect(el).toEqual(container.childNodes[0]);
    });

    it('should return the parent after elementClose', () => {
        patch(container, () => {
            elementOpen('div');
            elementClose('div');
            el = currentElement();
        });

        expect(el).toEqual(container);
    });

    it('should return the parent after elementVoid', () => {
        patch(container, () => {
            elementVoid('div');
            el = currentElement();
        });

        expect(el).toEqual(container);
    });

    it('should throw an error if not patching', () => {
        const error = 'Cannot call currentElement() unless in patch';
        expect(currentElement).toThrowError(new Error(error));
    });

    it('should throw an error if inside virtual attributes element', () => {
        const error =
            'currentElement() can not be called between elementOpenStart() and elementOpenEnd().';
        expect(() => {
            patch(container, () => {
                elementOpenStart('div');
                el = currentElement();
                elementOpenEnd('div');
                elementClose('div');
            });
        }).toThrowError(new Error(error));
    });
});
