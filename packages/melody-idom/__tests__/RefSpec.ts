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
import { patchOuter, elementOpen, elementClose, elementVoid } from '../src';

describe('ref', () => {
    const statics = ['class', 'refDiv'];
    const template = _context => {
        elementOpen('div');
        if (_context.cond) {
            elementOpen('section');
            elementVoid('div', '1', statics, 'ref', _context.myRef);
            elementClose('section');
        }
        elementClose('div');
    };

    it('should pass the element to the ref handler', () => {
        const el = document.createElement('div');
        const unsubscriber = jest.fn();
        const myRef = jest.fn(el => ({ unsubscribe: unsubscriber }));
        patchOuter(el, template, {
            cond: true,
            myRef,
        });
        expect(myRef).toHaveBeenCalledWith(el.querySelector('.refDiv'));
    });

    it('should pass the element after it has been inserted into the DOM to the handler', () => {
        const el = document.createElement('div');
        const unsubscriber = jest.fn();
        const myRef = jest.fn(node => {
            expect(node.parentNode.parentNode).toBe(el);
            return { unsubscribe: unsubscriber };
        });
        patchOuter(el, template, {
            cond: true,
            myRef,
        });
        expect(myRef).toHaveBeenCalledWith(el.querySelector('.refDiv'));
    });

    it('should only invoke the ref handler once', () => {
        const el = document.createElement('div');
        const unsubscriber = jest.fn();
        const myRef = jest.fn(el => ({ unsubscribe: unsubscriber }));
        patchOuter(el, template, {
            cond: true,
            myRef,
        });
        patchOuter(el, template, {
            cond: true,
            myRef,
        });
        expect(myRef).toHaveBeenCalledTimes(1);
    });

    it('should invoke the unsubscriber when the element is removed', () => {
        const el = document.createElement('div');
        const unsubscriber = jest.fn();
        const myRef = jest.fn(el => ({ unsubscribe: unsubscriber }));
        patchOuter(el, template, {
            cond: true,
            myRef,
        });
        patchOuter(el, template, {
            cond: false,
            myRef,
        });
        expect(unsubscriber).toHaveBeenCalled();
    });

    it('should invoke the unsubscriber when a new ref handler is provided', () => {
        const el = document.createElement('div');
        const unsubscriber = jest.fn();
        const unsubscriber2 = jest.fn();
        const myRef = jest.fn(el => ({ unsubscribe: unsubscriber }));
        const mySecondRef = jest.fn(el => ({ unsubscribe: unsubscriber2 }));
        patchOuter(el, template, {
            cond: true,
            myRef,
        });
        patchOuter(el, template, {
            cond: true,
            myRef: mySecondRef,
        });
        expect(unsubscriber).toHaveBeenCalled();
        expect(mySecondRef).toHaveBeenCalled();
    });

    it('should throw if a ref handler does not return an object with an unsubscriber function', () => {
        const el = document.createElement('div');
        expect(() => {
            patchOuter(el, template, {
                cond: true,
                myRef: jest.fn(),
            });
        }).toThrow();
        expect(() => {
            patchOuter(el, template, {
                cond: true,
                myRef: jest.fn(el => ({ unsubscribe: 'not a function' })),
            });
        }).toThrow();
    });
});
