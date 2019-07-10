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

import { patch, elementOpen, elementClose, elementVoid } from '../src';

describe('conditional rendering', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('nodes', () => {
        function render(condition) {
            elementOpen('div', 'outer', ['id', 'outer']);
            elementVoid('div', 'one', ['id', 'one']);

            if (condition) {
                elementVoid('div', 'conditional-one', [
                    'id',
                    'conditional-one',
                ]);
                elementVoid('div', 'conditional-two', [
                    'id',
                    'conditional-two',
                ]);
            }

            elementVoid('span', 'two', ['id', 'two']);
            elementClose('div');
        }

        it('should un-render when the condition becomes false', () => {
            patch(container, () => render(true));
            patch(container, () => render(false));
            const outer = container.childNodes[0];

            expect(outer.childNodes).toHaveLength(2);
            expect(outer.childNodes[0].id).toEqual('one');
            expect(outer.childNodes[0].tagName).toEqual('DIV');
            expect(outer.childNodes[1].id).toEqual('two');
            expect(outer.childNodes[1].tagName).toEqual('SPAN');
        });

        it('should render when the condition becomes true', () => {
            patch(container, () => render(false));
            patch(container, () => render(true));
            const outer = container.childNodes[0];

            expect(outer.childNodes).toHaveLength(4);
            expect(outer.childNodes[0].id).toEqual('one');
            expect(outer.childNodes[0].tagName).toEqual('DIV');
            expect(outer.childNodes[1].id).toEqual('conditional-one');
            expect(outer.childNodes[1].tagName).toEqual('DIV');
            expect(outer.childNodes[2].id).toEqual('conditional-two');
            expect(outer.childNodes[2].tagName).toEqual('DIV');
            expect(outer.childNodes[3].id).toEqual('two');
            expect(outer.childNodes[3].tagName).toEqual('SPAN');
        });
    });

    describe('with only conditional childNodes', () => {
        function render(condition) {
            elementOpen('div', 'outer', ['id', 'outer']);

            if (condition) {
                elementVoid('div', 'conditional-one', [
                    'id',
                    'conditional-one',
                ]);
                elementVoid('div', 'conditional-two', [
                    'id',
                    'conditional-two',
                ]);
            }

            elementClose('div');
        }

        it('should not leave any remaning nodes', () => {
            patch(container, () => render(true));
            patch(container, () => render(false));
            const outer = container.childNodes[0];

            expect(outer.childNodes).toHaveLength(0);
        });
    });

    describe('with static attributes', () => {
        const _statics = ["class", "foo"];
        function render(_context) {
            elementOpen("div", null, null);

             if (_context.condition) {
                elementVoid("div", "7*U2;JR", _statics);
            } else {
                elementVoid("div", null, null, "class", "foo " + (_context.bar ? "bar" : ""));
            }

             elementClose("div");
        }

         it('should apply static attributes when recycling an element', () => {
            patch(container, () => render({ condition: false, bar: true }));
            expect(container.innerHTML).toMatchSnapshot();
            patch(container, () => render({ condition: true, bar: true }));
            expect(container.innerHTML).toMatchSnapshot();
        });

         it('should remove static attributes when recycling an element', () => {
            patch(container, () => render({ condition: true, bar: true }));
            expect(container.innerHTML).toMatchSnapshot();
            patch(container, () => render({ condition: false, bar: true }));
            expect(container.innerHTML).toMatchSnapshot();
        });
    });

    describe('nodes', () => {
        function render(condition) {
            elementOpen('div', null, null, 'id', 'outer');
            elementVoid('div', null, null, 'id', 'one');

            if (condition) {
                elementOpen(
                    'span',
                    'conditional',
                    null,
                    'id',
                    'conditional-one',
                    'data-foo',
                    'foo'
                );
                elementVoid('span');
                elementClose('span');
            }

            elementVoid('span', 'last', null, 'id', 'two');
            elementClose('div');
        }

        it('should strip children when a conflicting node is re-used', () => {
            patch(container, () => render(true));
            patch(container, () => render(false));
            const outer = container.childNodes[0];

            expect(outer.childNodes).toHaveLength(2);
            expect(outer.childNodes[0].id).toEqual('one');
            expect(outer.childNodes[0].tagName).toEqual('DIV');
            expect(outer.childNodes[1].id).toEqual('two');
            expect(outer.childNodes[1].tagName).toEqual('SPAN');
            expect(outer.childNodes[1].children.length).toEqual(0);
        });

        it('should strip attributes when a conflicting node is re-used', () => {
            patch(container, () => render(true));
            patch(container, () => render(false));
            const outer = container.childNodes[0];

            expect(outer.childNodes[1].getAttribute('data-foo')).toBeNull();
        });
    });
});
