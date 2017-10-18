/**
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
import { patch, raw, text, rawString, elementOpen, elementClose } from '../src';
import { expect } from 'chai';

describe('raw text nodes', () => {
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
                raw('<span>hello</span>');
            });
            const node = container.childNodes[0];

            expect(node.outerHTML).to.equal('<span>hello</span>');
        });
    });

    describe('when used as a marker', () => {
        it('should render a text node with the specified value', () => {
            patch(container, () => {
                text(rawString('<span>hello</span>'));
            });
            const node = container.childNodes[0];

            expect(node.outerHTML).to.equal('<span>hello</span>');
        });
    });

    describe('with conditional text', () => {
        function render(data) {
            raw(data);
        }

        it('should update the DOM when the text is updated', () => {
            patch(container, () => render('<span>Hello</span>'));
            patch(container, () => render('<span>Hello World!</span>'));
            const node = container.childNodes[0];

            expect(node.outerHTML).to.equal('<span>Hello World!</span>');
        });

        it('should skip the DOM when the text is unchanged', () => {
            patch(container, () => render('<span>Hello</span>'));
            const oldNode = container.childNodes[0];
            patch(container, () => render('<span>Hello</span>'));
            const node = container.childNodes[0];
            expect(node).to.equal(oldNode);
            expect(node.outerHTML).to.equal('<span>Hello</span>');
        });
    });

    describe('with multi-element text', function() {
        function render(data) {
            raw(data);
        }

        it('should remove unnecessary elements', () => {
            patch(container, () =>
                render('<span>Hello</span><div>World</div>'),
            );
            expect(container.outerHTML).to.equal(
                '<div><span>Hello</span><div>World</div></div>',
            );

            patch(container, () => render('<span>Hello World!</span>'));
            expect(container.outerHTML).to.equal(
                '<div><span>Hello World!</span></div>',
            );
        });

        it('should not replace elements if data is unchanged', () => {
            patch(container, () =>
                render('<span>Hello</span><div>World</div>'),
            );
            const firstChild = container.children[0];
            const secondChild = container.children[1];
            expect(container.outerHTML).to.equal(
                '<div><span>Hello</span><div>World</div></div>',
            );

            patch(container, () =>
                render('<span>Hello</span><div>World</div>'),
            );
            expect(firstChild).to.equal(container.children[0]);
            expect(secondChild).to.equal(container.children[1]);
            expect(container.outerHTML).to.equal(
                '<div><span>Hello</span><div>World</div></div>',
            );
        });
    });

    describe('when dealing with empty text', function() {
        function render(data) {
            raw(data);
        }

        it('should not render anything', function() {
            patch(container, () => render(''));
            expect(container.outerHTML).to.equal('<div></div>');
        });

        it('should override the previous raw text', function() {
            patch(container, () => render('<span>Test</span>'));
            expect(container.outerHTML).to.equal(
                '<div><span>Test</span></div>',
            );

            patch(container, () => render(''));
            expect(container.outerHTML).to.equal('<div></div>');
        });

        it('should override the previously empty raw text', function() {
            patch(container, () => render(''));
            expect(container.outerHTML).to.equal('<div></div>');

            patch(container, () => render('<span>Test</span>'));
            expect(container.outerHTML).to.equal(
                '<div><span>Test</span></div>',
            );
        });
    });
});
