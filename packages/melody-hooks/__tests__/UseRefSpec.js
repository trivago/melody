/**
 * Copyright 2018 trivago N.V.
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
import { render } from 'melody-component';
import { component, elementOpen, elementClose, elementVoid } from 'melody-idom';
import { createComponent, useState, useEffect, useRef } from '../src';
import { getRefCounter } from '../src/hooks/useRef';
import { flush } from './util/flush';

const createParentComponent = Child => {
    return createComponent(props => props, {
        render(_context) {
            elementOpen('div');
            if (_context.show) {
                component(Child, 'MyComponent');
            }
            elementClose('div');
        },
    });
};

describe('useRef', () => {
    it('should give a reference to the element', () => {
        const template = {
            render(_context) {
                elementVoid('div', null, null, 'ref', _context.myref);
            },
        };
        const root = document.createElement('div');
        let current;
        let currentInEffect;
        const MyComponent = createComponent(() => {
            const myref = useRef(null);
            current = myref.current;
            useEffect(() => {
                currentInEffect = myref.current;
            }, []);
            return { myref };
        }, template);
        render(root, MyComponent);
        expect(current).toBeNull();
        expect(currentInEffect).toBeInstanceOf(HTMLDivElement);
    });
    it('should remove the reference when a component is unmounted', () => {
        const root = document.createElement('div');
        let ref;
        const Child = createComponent(
            () => {
                const myref = useRef(null);
                ref = myref;
                return { myref };
            },
            {
                render(_context) {
                    elementOpen('span');
                    elementVoid('div', null, null, 'ref', _context.myref);
                    elementClose('span');
                },
            }
        );
        const Parent = createParentComponent(Child);
        render(root, Parent, { show: true });
        expect(getRefCounter(ref)).toEqual(0);
        render(root, Parent, { show: false });
        expect(getRefCounter(ref)).toEqual(-1);
        expect(ref.current).toBeUndefined();
    });
    it('should move the reference to another element', () => {
        const template = {
            render(_context) {
                elementOpen('div');
                if (_context.foo) {
                    elementVoid(
                        'span',
                        null,
                        ['class', 'foo'],
                        'ref',
                        _context.myref
                    );
                } else {
                    elementVoid(
                        'div',
                        null,
                        ['class', 'bar'],
                        'ref',
                        _context.myref
                    );
                }
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let setter;
        let ref;
        let current;
        let currentInEffect;
        const MyComponent = createComponent(() => {
            const [foo, setFoo] = useState(false);
            setter = setFoo;
            const myref = useRef(null);
            ref = myref;
            current = myref.current;
            useEffect(() => {
                currentInEffect = myref.current;
            });
            return { myref, foo };
        }, template);
        render(root, MyComponent);
        expect(current).toBeNull();
        expect(currentInEffect.className).toEqual('bar');
        expect(getRefCounter(ref)).toEqual(0);
        setter(true);
        flush();
        expect(current.className).toEqual('bar');
        expect(currentInEffect.className).toEqual('foo');
        expect(getRefCounter(ref)).toEqual(0);
        setter(false);
        flush();
        expect(current.className).toEqual('foo');
        expect(getRefCounter(ref)).toEqual(0);
    });
    it('should move the reference to another element 2', () => {
        const template = {
            render(_context) {
                elementOpen('div');
                if (!_context.foo) {
                    elementVoid(
                        'span',
                        null,
                        ['class', 'foo'],
                        'ref',
                        _context.myref
                    );
                } else {
                    elementVoid(
                        'div',
                        null,
                        ['class', 'bar'],
                        'ref',
                        _context.myref
                    );
                }
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let setter;
        let ref;
        let current;
        let currentInEffect;
        const MyComponent = createComponent(() => {
            const [foo, setFoo] = useState(false);
            setter = setFoo;
            const myref = useRef(null);
            ref = myref;
            current = myref.current;
            useEffect(() => {
                currentInEffect = myref.current;
            });
            return { myref, foo };
        }, template);
        render(root, MyComponent);
        expect(current).toBeNull();
        expect(currentInEffect.className).toEqual('foo');
        expect(getRefCounter(ref)).toEqual(0);
        setter(true);
        flush();
        expect(current.className).toEqual('foo');
        expect(currentInEffect.className).toEqual('bar');
        expect(getRefCounter(ref)).toEqual(0);
        setter(false);
        flush();
        expect(current.className).toEqual('bar');
        expect(getRefCounter(ref)).toEqual(0);
    });
});
