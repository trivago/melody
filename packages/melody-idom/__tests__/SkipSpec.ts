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
    elementClose,
    elementVoid,
    skip,
    text,
} from '../src';

describe('skip', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    function render(data) {
        elementOpen('div');
        if (data.skip) {
            skip();
        } else {
            text('some ');
            text('text');
        }
        elementClose('div');
    }

    it('should keep any DOM nodes in the subtree', () => {
        patch(container, render, { skip: false });
        patch(container, render, { skip: true });

        expect(container.textContent).toEqual('some text');
    });

    it('should throw if an element is declared after skipping', () => {
        const error =
            'elementOpen() may not be called inside an element that has called skip().';
        expect(() => {
            patch(container, () => {
                skip();
                elementOpen('div');
                elementClose('div');
            });
        }).toThrowError(new Error(error));
    });

    it('should throw if a text is declared after skipping', () => {
        const error =
            'text() may not be called inside an element that has called skip().';
        expect(() => {
            patch(container, () => {
                skip();
                text('text');
            });
        }).toThrowError(new Error(error));
    });

    it('should throw skip is called after declaring an element', () => {
        const error =
            'skip() must come before any child declarations inside the current element.';
        expect(() => {
            patch(container, () => {
                elementVoid('div');
                skip();
            });
        }).toThrowError(new Error(error));
    });

    it('should throw skip is called after declaring a text', () => {
        const error =
            'skip() must come before any child declarations inside the current element.';
        expect(() => {
            patch(container, () => {
                text('text');
                skip();
            });
        }).toThrowError(new Error(error));
    });
});
