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

import { patch, text } from '../src';

describe('formatters', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('for newly created Text nodes', () => {
        function sliceOne(str) {
            return str.slice(1);
        }

        function prefixQuote(str) {
            return "'" + str;
        }

        it('should render with the specified formatted value', () => {
            patch(container, () => {
                text('hello world!', sliceOne, prefixQuote);
            });
            const node = container.childNodes[0];

            expect(node.textContent).toEqual("'ello world!");
        });
    });

    describe('for updated Text nodes', () => {
        let stub;

        function render(value) {
            text(value, stub);
        }

        beforeEach(() => {
            stub = jest
                .fn()
                .mockReturnValue('default')
                .mockReturnValueOnce('stubValueOne')
                .mockReturnValueOnce('stubValueTwo');
        });

        it('should not call the formatter for unchanged values', () => {
            patch(container, () => render('hello'));
            patch(container, () => render('hello'));

            const node = container.childNodes[0];

            expect(node.textContent).toEqual('stubValueOne');
            expect(stub).toHaveBeenCalledTimes(1);
        });

        it('should call the formatter when the value changes', () => {
            patch(container, () => render('hello'));
            patch(container, () => render('world'));
            const node = container.childNodes[0];

            expect(node.textContent).toEqual('stubValueTwo');
            expect(stub).toHaveBeenCalledTimes(2);
        });
    });

    it('should not leak the arguments object', () => {
        const spy = jest.fn(() => 'value');

        patch(container, () => text('value', spy));

        expect(spy).toHaveBeenCalledWith('value');
    });
});
