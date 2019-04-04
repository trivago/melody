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
    currentElement,
    skip,
} from '../src';

const BROWSER_SUPPORTS_SHADOW_DOM = 'ShadowRoot' in window;
const attachShadow = function(el) {
    return el.attachShadow
        ? el.attachShadow({ mode: 'closed' })
        : el.createShadowRoot();
};

describe('rendering with keys', () => {
    let container;

    function render(items) {
        for (let i = 0; i < items.length; i++) {
            const key = items[i].key;
            elementVoid('div', key, key ? ['id', key] : null);
        }
    }

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should not re-use a node with a non-null key', () => {
        const items = [{ key: 'one' }];

        patch(container, () => render(items));
        const keyedNode = container.childNodes[0];

        items.unshift({ key: null });
        patch(container, () => render(items));

        expect(container.childNodes).toHaveLength(2);
        expect(container.childNodes[0]).not.toEqual(keyedNode);
    });

    it('should not modify DOM nodes with falsey keys', () => {
        const slice = Array.prototype.slice;
        const items = [{ key: null }, { key: undefined }, { key: '' }];

        patch(container, () => render(items));
        const nodes = slice.call(container.childNodes);

        patch(container, () => render(items));

        expect(slice.call(container.childNodes)).toEqual(nodes);
    });

    it('should not modify the DOM nodes when inserting', () => {
        const items = [{ key: 'one' }, { key: 'two' }];

        patch(container, () => render(items));
        const firstNode = container.childNodes[0];
        const secondNode = container.childNodes[1];

        items.splice(1, 0, { key: 'one-point-five' });
        patch(container, () => render(items));

        expect(container.childNodes).toHaveLength(3);
        expect(container.childNodes[0]).toEqual(firstNode);
        expect(container.childNodes[0].id).toEqual('one');
        expect(container.childNodes[1].id).toEqual('one-point-five');
        expect(container.childNodes[2]).toEqual(secondNode);
        expect(container.childNodes[2].id).toEqual('two');
    });

    it('should not modify the DOM nodes when removing', () => {
        const items = [{ key: 'one' }, { key: 'two' }, { key: 'three' }];

        patch(container, () => render(items));
        const firstNode = container.childNodes[0];
        const thirdNode = container.childNodes[2];

        items.splice(1, 1);
        patch(container, () => render(items));

        expect(container.childNodes).toHaveLength(2);
        expect(container.childNodes[0]).toEqual(firstNode);
        expect(container.childNodes[0].id).toEqual('one');
        expect(container.childNodes[1]).toEqual(thirdNode);
        expect(container.childNodes[1].id).toEqual('three');
    });

    it('should not modify the DOM nodes when re-ordering', () => {
        const items = [{ key: 'one' }, { key: 'two' }, { key: 'three' }];

        patch(container, () => render(items));
        const firstNode = container.childNodes[0];
        const secondNode = container.childNodes[1];
        const thirdNode = container.childNodes[2];

        items.splice(1, 1);
        items.push({ key: 'two' });
        patch(container, () => render(items));

        expect(container.childNodes).toHaveLength(3);
        expect(container.childNodes[0]).toEqual(firstNode);
        expect(container.childNodes[0].id).toEqual('one');
        expect(container.childNodes[1]).toEqual(thirdNode);
        expect(container.childNodes[1].id).toEqual('three');
        expect(container.childNodes[2]).toEqual(secondNode);
        expect(container.childNodes[2].id).toEqual('two');
    });

    it('should avoid collisions with Object.prototype', () => {
        const items = [{ key: 'hasOwnProperty' }];

        patch(container, () => render(items));
        expect(container.childNodes).toHaveLength(1);
    });

    it("should not reuse dom node when nodeName doesn't match", () => {
        function render(tag) {
            elementVoid(tag, 'key');
        }

        patch(container, render, 'div');
        const firstNode = container.childNodes[0];

        patch(container, render, 'span');
        const newNode = container.childNodes[0];
        expect(newNode).not.toEqual(firstNode);
        expect(newNode.nodeName).toEqual('SPAN');
        expect(firstNode.parentNode).toBeNull();
    });

    it('should preserve nodes already in the DOM', () => {
        function render() {
            elementVoid('div', 'key');
            elementVoid('div');
        }

        container.innerHTML = `
      <div></div>
      <div key="key"><div>
    `;
        const keyedDiv = container.lastChild;

        patch(container, render);

        expect(container.firstChild).toEqual(keyedDiv);
    });

    it('should remove keyed nodes whose element type changes', () => {
        function render() {
            elementVoid('div', 'key');
            elementVoid('div');
        }

        container.innerHTML = `
      <div></div>
      <span key="key"><span>
    `;

        patch(container, render);

        expect(container.innerHTML).toEqual('<div></div><div></div>');
    });

    describe('an item with focus', () => {
        function render(items) {
            for (let i = 0; i < items.length; i++) {
                const key = items[i].key;
                elementOpen('div', key);
                elementVoid('div', null, null, 'id', key, 'tabindex', -1);
                elementClose('div');
            }
        }

        it('should retain focus when prepending a new item', () => {
            const items = [{ key: 'one' }];

            patch(container, () => render(items));
            const focusNode = container.querySelector('#one');
            focusNode.focus();

            items.unshift({ key: 'zero' });
            patch(container, () => render(items));

            expect(document.activeElement).toEqual(focusNode);
        });

        it('should retain focus when moving up in DOM order', () => {
            const items = [{ key: 'one' }, { key: 'two' }, { key: 'three' }];

            patch(container, () => render(items));
            const focusNode = container.querySelector('#three');
            focusNode.focus();

            items.unshift(items.pop());
            patch(container, () => render(items));

            expect(document.activeElement).toEqual(focusNode);
        });

        it('should retain focus when moving down in DOM order', () => {
            const items = [{ key: 'one' }, { key: 'two' }, { key: 'three' }];

            patch(container, () => render(items));
            const focusNode = container.querySelector('#one');
            focusNode.focus();

            items.push(items.shift());
            patch(container, () => render(items));

            expect(document.activeElement).toEqual(focusNode);
        });

        it('should retain focus when doing a nested patch', () => {
            function renderInner(id) {
                elementVoid('div', null, null, 'id', id, 'tabindex', -1);
            }

            function render() {
                for (let i = 0; i < items.length; i++) {
                    const key = items[i].key;
                    elementOpen('div', key, null);
                    patch(currentElement(), () => renderInner(key));
                    skip();
                    elementClose('div');
                }
            }

            const items = [{ key: 'one' }, { key: 'two' }, { key: 'three' }];

            patch(container, () => render(items));
            const focusNode = container.querySelector('#three');
            focusNode.focus();

            items.unshift(items.pop());
            patch(container, () => render(items));

            expect(document.activeElement).toEqual(focusNode);
        });

        if (BROWSER_SUPPORTS_SHADOW_DOM) {
            it('should retain focus when patching a ShadowRoot', () => {
                const items = [{ key: 'one' }];

                const shadowRoot = attachShadow(container);
                patch(shadowRoot, () => render(items));
                const focusNode = shadowRoot.querySelector('#one');
                focusNode.focus();

                items.unshift({ key: 'zero' });
                patch(shadowRoot, () => render(items));

                expect(shadowRoot.activeElement).toEqual(focusNode);
                expect(document.activeElement).toEqual(container);
            });

            it('should retain focus when patching outside a ShadowRoot', () => {
                const items = [{ key: 'one' }];

                const shadowRoot = attachShadow(container);
                const shadowEl = shadowRoot.appendChild(
                    document.createElement('div')
                );
                shadowEl.tabIndex = -1;
                shadowEl.focus();

                items.unshift({ key: 'zero' });
                patch(container, () => render(items));

                expect(shadowRoot.activeElement).toEqual(shadowEl);
            });
        }
    });
});
