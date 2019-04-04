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
} from '../src';

describe('element creation', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('when creating a single node', () => {
        let el;

        beforeEach(() => {
            patch(container, () => {
                elementVoid(
                    'div',
                    'key',
                    [
                        'id',
                        'someId',
                        'class',
                        'someClass',
                        'data-custom',
                        'custom',
                    ],
                    'data-foo',
                    'Hello',
                    'data-bar',
                    'World'
                );
            });

            el = container.childNodes[0];
        });

        it('should render with the specified tag', () => {
            expect(el.tagName).toEqual('DIV');
        });

        it('should render with static attributes', () => {
            expect(el.id).toEqual('someId');
            expect(el.className).toEqual('someClass');
            expect(el.getAttribute('data-custom')).toEqual('custom');
        });

        it('should render with dynamic attributes', () => {
            expect(el.getAttribute('data-foo')).toEqual('Hello');
            expect(el.getAttribute('data-bar')).toEqual('World');
        });

        describe('should return DOM node', () => {
            beforeEach(() => {
                patch(container, () => {});
            });

            it('from elementOpen', () => {
                patch(container, () => {
                    el = elementOpen('div');
                    elementClose('div');
                });

                expect(el).toEqual(container.childNodes[0]);
            });

            it('from elementClose', () => {
                patch(container, () => {
                    elementOpen('div');
                    el = elementClose('div');
                });

                expect(el).toEqual(container.childNodes[0]);
            });

            it('from elementVoid', () => {
                patch(container, () => {
                    el = elementVoid('div');
                });

                expect(el).toEqual(container.childNodes[0]);
            });

            it('from elementOpenEnd', () => {
                patch(container, () => {
                    elementOpenStart('div');
                    el = elementOpenEnd('div');
                    elementClose('div');
                });

                expect(el).toEqual(container.childNodes[0]);
            });
        });
    });

    it('should allow creation without static attributes', () => {
        patch(container, () => {
            elementVoid('div', null, null, 'id', 'test');
        });
        const el = container.childNodes[0];
        expect(el.id).toEqual('test');
    });

    describe('for HTML elements', () => {
        it('should use the XHTML namespace', () => {
            patch(container, () => {
                elementVoid('div');
            });

            const el = container.childNodes[0];
            expect(el.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
        });

        it('should use createElement if no namespace has been specified', () => {
            let doc = container.ownerDocument;
            let div = doc.createElement('div');
            let el;

            const spy = jest.spyOn(doc, 'createElement');

            patch(container, () => {
                elementOpen('svg');
                elementOpen('foreignObject');
                el = elementVoid('div');
                elementClose('foreignObject');
                elementClose('svg');
            });

            expect(el.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('for svg elements', () => {
        beforeEach(() => {
            patch(container, () => {
                elementOpen('svg');
                elementOpen('g');
                elementVoid('circle');
                elementClose('g');
                elementOpen('foreignObject');
                elementVoid('p');
                elementClose('foreignObject');
                elementVoid('path');
                elementClose('svg');
            });
        });

        it('should create svgs in the svg namespace', () => {
            const el = container.querySelector('svg');
            expect(el.namespaceURI).toEqual('http://www.w3.org/2000/svg');
        });

        it('should create descendants of svgs in the svg namespace', () => {
            const el = container.querySelector('circle');
            expect(el.namespaceURI).toEqual('http://www.w3.org/2000/svg');
        });

        it('should have the svg namespace for foreignObjects', () => {
            const el = container.querySelector('svg').childNodes[1];
            expect(el.namespaceURI).toEqual('http://www.w3.org/2000/svg');
        });

        it('should revert to the xhtml namespace when encounering a foreignObject', () => {
            const el = container.querySelector('p');
            expect(el.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
        });

        it('should reset to the previous namespace after exiting a forignObject', () => {
            const el = container.querySelector('path');
            expect(el.namespaceURI).toEqual('http://www.w3.org/2000/svg');
        });

        it('should create children in the svg namespace when patching an svg', () => {
            const svg = container.querySelector('svg');
            patch(svg, () => {
                elementVoid('rect');
            });

            const el = svg.querySelector('rect');
            expect(el.namespaceURI).toEqual('http://www.w3.org/2000/svg');
        });
    });
});
