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
    patchOuter,
    elementOpen,
    elementClose,
    elementVoid,
    text,
} from '../src';

describe('patching an element', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should update attributes', () => {
        function render() {
            elementVoid('div', null, null, 'tabindex', '0');
        }

        patchOuter(container, render);

        expect(container.getAttribute('tabindex')).toEqual('0');
    });

    it('should return the DOM node', () => {
        function render() {
            elementVoid('div');
        }

        const result = patchOuter(container, render);

        expect(result).toEqual(container);
    });

    it('should update children', () => {
        function render() {
            elementOpen('div');
            elementVoid('span');
            elementClose('div');
        }

        patchOuter(container, render);

        expect(container.firstChild.tagName).toEqual('SPAN');
    });

    it('should be re-entrant', function() {
        const containerOne = document.createElement('div');
        const containerTwo = document.createElement('div');

        function renderOne() {
            elementOpen('div');
            patchOuter(containerTwo, renderTwo);
            text('hello');
            elementClose('div');
        }

        function renderTwo() {
            elementOpen('div');
            text('foobar');
            elementClose('div');
        }

        patchOuter(containerOne, renderOne);

        expect(containerOne.textContent).toEqual('hello');
        expect(containerTwo.textContent).toEqual('foobar');
    });

    it('should pass third argument to render function', () => {
        function render(content) {
            elementOpen('div');
            text(content);
            elementClose('div');
        }

        patchOuter(container, render, 'foobar');

        expect(container.textContent).toEqual('foobar');
    });

    it('should patch a detached node', () => {
        const container = document.createElement('div');
        function render() {
            elementOpen('div');
            elementVoid('span');
            elementClose('div');
        }

        patchOuter(container, render);

        expect(container.firstChild.tagName).toEqual('SPAN');
    });

    describe('with an empty patch', () => {
        let div;
        let result;

        beforeEach(() => {
            div = container.appendChild(document.createElement('div'));

            result = patchOuter(div, () => {});
        });

        it('should remove the DOM node on an empty patch', () => {
            expect(container.firstChild).toBeNull();
        });

        it('should remove the DOM node on an empty patch', () => {
            expect(result).toBeNull();
        });
    });

    describe('with a different tag', () => {
        describe('without a key', () => {
            let div;
            let span;
            let result;

            function render() {
                elementVoid('span');
            }

            beforeEach(() => {
                div = container.appendChild(document.createElement('div'));

                result = patchOuter(div, render);
                span = container.querySelector('span');
            });

            it('should replace the DOM node', () => {
                expect(container.children).toHaveLength(1);
                expect(container.firstChild).toEqual(span);
            });

            it('should return the new DOM node', () => {
                expect(result).toEqual(span);
            });
        });

        describe('with a different key', () => {
            let div;
            let el;

            function render(data) {
                el = elementVoid(data.tag, data.key);
            }

            beforeEach(() => {
                div = container.appendChild(document.createElement('div'));
            });

            it('should replace the DOM node when a key changes', () => {
                div.setAttribute('key', 'key0');
                patchOuter(div, render, { tag: 'span', key: 'key1' });
                expect(container.children).toHaveLength(1);
                expect(container.firstChild).toEqual(el);
            });

            it('should replace the DOM node when a key is removed', () => {
                div.setAttribute('key', 'key0');
                patchOuter(div, render, { tag: 'span' });
                expect(container.children).toHaveLength(1);
                expect(container.firstChild.tagName).toEqual('SPAN');
                expect(container.firstChild).toEqual(el);
            });

            it('should replace the DOM node when a key is added', () => {
                patchOuter(div, render, { tag: 'span', key: 'key2' });
                expect(container.children).toHaveLength(1);
                expect(container.firstChild).toEqual(el);
            });
        });
    });

    it('should not hang on to removed elements with keys', () => {
        function render() {
            elementVoid('div', 'key');
        }

        const divOne = container.appendChild(document.createElement('div'));
        patchOuter(divOne, render);
        const el = container.firstChild;
        patchOuter(el, () => {});
        const divTwo = container.appendChild(document.createElement('div'));
        patchOuter(divTwo, render);

        expect(container.children).toHaveLength(1);
        expect(container.firstChild).not.toBe(el);
    });

    it('should throw an error when patching too many elements', () => {
        const div = container.appendChild(document.createElement('div'));
        function render() {
            elementVoid('div');
            elementVoid('div');
        }
        const error =
            'There must be exactly one top level call corresponding to the patched element.';
        expect(() => patchOuter(div, render)).toThrowError(new Error(error));
    });

    describe('that does not exist', function() {
        it('should throw an error', function() {
            const error = 'Patch invoked without an element.';
            expect(() =>
                patchOuter(null, function() {
                    expect(false).toBeTruthy();
                })
            ).toThrow(new Error(error));
        });
    });
});
