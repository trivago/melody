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

import { patch, text, elementOpenStart } from '../src';

describe('text nodes', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('when created', () => {
        it('should render a text node with the specified value', () => {
            patch(container, () => {
                text('Hello world!');
            });
            const node = container.childNodes[0];

            expect(node.textContent).toEqual('Hello world!');
            expect(node).toBeInstanceOf(Text);
        });

        it('should allow for multiple text nodes under one parent element', () => {
            patch(container, () => {
                text('Hello ');
                text('World');
                text('!');
            });

            expect(container.textContent).toEqual('Hello World!');
        });

        it('should throw when inside virtual attributes element', () => {
            const error =
                'text() can not be called between elementOpenStart() and elementOpenEnd().';
            expect(() => {
                patch(container, () => {
                    elementOpenStart('div');
                    text('Hello');
                });
            }).toThrowError(new Error(error));
        });
    });

    describe('with conditional text', () => {
        function render(data) {
            text(data);
        }

        it('should update the DOM when the text is updated', () => {
            patch(container, () => render('Hello'));
            patch(container, () => render('Hello World!'));
            const node = container.childNodes[0];

            expect(node.textContent).toEqual('Hello World!');
        });
    });
});
