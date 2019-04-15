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

import { fakeSchedulers } from 'rxjs-marbles/jest';
import {
    elementOpen,
    elementClose,
    text,
    component,
    patchOuter,
} from 'melody-idom';
import { createComponent, render } from '../src';
import { flush } from './util/flush';
import {
    createSubjects,
    next,
    applyAsGroupAndComplete,
} from './util/testHelpers';
import { last, first } from 'rxjs/operators';
import { Observable, ReplaySubject, concat, throwError, of } from 'rxjs';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

const subscribeToUpdates = subject => ({ props, updates }) => {
    updates.subscribe(...next(subject));
    return props;
};

describe('component', () => {
    it('createComponent should support currying', () => {
        const template1 = {
            render(_context) {
                elementOpen('div');
                elementOpen('span');
                text(_context.value);
                elementClose('span');
                elementClose('div');
            },
        };
        const template2 = {
            render(_context) {
                elementOpen('div');
                elementOpen('div');
                text(_context.value);
                elementClose('div');
                elementClose('div');
            },
        };
        const createHashtagComponent = createComponent(({ props }) => props);
        const SpanHashtagComponent = createHashtagComponent(template1);
        const DivHashtagComponent = createHashtagComponent(template2);

        const root1 = document.createElement('div');
        render(root1, SpanHashtagComponent, { value: 'foo' });

        const root2 = document.createElement('div');
        render(root2, DivHashtagComponent, { value: 'foo' });
    });
    it('should render when props have changed', () => {
        const root = document.createElement('div');
        const [updateSubj] = createSubjects(1);
        const MyComponent = createComponent(
            subscribeToUpdates(updateSubj),
            template
        );
        expect(
            applyAsGroupAndComplete(updateSubj, render, [
                [root, MyComponent, { value: 'foo' }],
                [root, MyComponent, { value: 'bar' }],
            ])
        ).resolves.toHaveLength(2);
        expect(root.innerHTML).toBe('bar');
    });
    it('should not rerender when props have not changed', () => {
        const root = document.createElement('div');
        const [updateSubj] = createSubjects(1);
        const MyComponent = createComponent(
            subscribeToUpdates(updateSubj),
            template
        );
        expect(
            applyAsGroupAndComplete(updateSubj, render, [
                [root, MyComponent, { value: 'foo' }],
                [root, MyComponent, { value: 'foo' }],
            ])
        ).resolves.toHaveLength(1);
    });
    it("should not rerender children when props haven't changed", () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text('Hello');
                elementClose('div');
            },
        };
        const [updateSubj] = createSubjects(1);
        const MyComponent = createComponent(
            subscribeToUpdates(updateSubj),
            childTemplate
        );

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4');
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            ({ props }) => props,
            parentTemplate
        );
        const root = document.createElement('div');
        expect(
            applyAsGroupAndComplete(updateSubj, render, [
                [root, MyParentComponent],
                [root, MyParentComponent],
            ])
        ).resolves.toHaveLength(1);
    });
    it('should replace components', () => {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const MyComponent = createComponent(({ props }) => props, template);
        const MyOtherComponent = createComponent(
            ({ props }) => props,
            template
        );

        render(root, MyComponent, { text: 'hello' });
        expect(root.outerHTML).toEqual('<div>hello</div>');
        render(root, MyOtherComponent, { text: 'test' });
        expect(root.outerHTML).toEqual('<div>test</div>');
    });
    it('execute the component function once', () => {
        const [subj] = createSubjects(1);
        const root = document.createElement('div');
        let count = 0;
        const MyComponent = createComponent(({ props, updates }) => {
            updates.subscribe(...next(subj));
            return Observable.create(observer => {
                count++;
                observer.next({ text: 'hello' });
            });
        }, template);
        applyAsGroupAndComplete(subj, render, [
            [root, MyComponent, { value: 'foo' }],
        ]).then(rendered => {
            expect(count).toBe(1);
            expect(rendered).toHaveLength(1);
        });
    });
    it(
        'should emit a warning message after 500ms if not state updates',
        fakeSchedulers(advance => {
            jest.useFakeTimers();
            const warnMessage =
                'Warning: Your Component did not emit any state updates for at least 500ms.';
            const root = document.createElement('div');
            const MyComponent = createComponent(
                () => Observable.create(),
                template
            );
            render(root, MyComponent);
            /* eslint-disable no-console */
            const temp = console.warn;
            console.warn = jest.fn();
            advance(499);
            expect(console.warn).not.toHaveBeenCalledWith(warnMessage);
            advance(1);
            expect(console.warn).toHaveBeenCalledWith(warnMessage);
            console.warn = temp;
            /* eslint-enable no-console */
        })
    );
    it('should pass through an error message for non-production environments', () => {
        const root = document.createElement('div');
        const error = new Error('oops!');
        const MyComponent = createComponent(
            () => concat(of(7), throwError(error)),
            template
        );
        /* eslint-disable no-console */
        const temp = console.error;
        console.error = jest.fn();
        render(root, MyComponent);
        expect(console.error).toHaveBeenCalledWith('Error: ', error);
        console.error = temp;
        /* eslint-enable no-console */
    });
    it(
        'should not emit a warning message after if component emits state before 500ms if not state updates',
        fakeSchedulers(advance => {
            jest.useFakeTimers();
            const root = document.createElement('div');
            const MyComponent = createComponent(({ props }) => props, template);
            render(root, MyComponent, { value: 'foo' });
            /* eslint-disable no-console */
            const temp = console.warn;
            console.warn = jest.fn();
            advance(500);
            expect(console.warn).not.toHaveBeenCalledWith(
                'Warning: Your Component did not emit any state updates for at least 500ms.'
            );
            console.warn = temp;
            /* eslint-enable no-console */
        })
    );
    it('should unmount replaced components', () => {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');

        // Use ReplaySubject here because render one time before subscribing.
        // This will get us all emittances over time in the end when we complete the stream.
        const unmountedSubj = new ReplaySubject(2); // Buffersize 2 to make sure we are not cheating on the result while expecting only 1 emittance in the end
        const MyComponent = createComponent(({ props, updates }) => {
            updates.pipe(last()).subscribe(...next(unmountedSubj));
            return props;
        }, template);
        const MyOtherComponent = createComponent(
            ({ props }) => props,
            template
        );

        render(root, MyComponent, { text: 'hello' });
        expect(root.outerHTML).toEqual('<div>hello</div>');
        expect(
            applyAsGroupAndComplete(unmountedSubj, render, [
                [root, MyOtherComponent, { text: 'test' }],
            ])
        ).resolves.toHaveLength(1);
        expect(root.outerHTML).toEqual('<div>test</div>');
    });
    it('should render components into an existing DOM', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const [updateSubj] = createSubjects(1);
        const MyComponent = createComponent(
            subscribeToUpdates(updateSubj),
            childTemplate
        );

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '3', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            ({ props }) => props,
            parentTemplate
        );

        const root = document.createElement('div');
        root.innerHTML = '<div>test</div>';
        expect(root.outerHTML).toBe('<div><div>test</div></div>');
        applyAsGroupAndComplete(updateSubj, render, [
            [root, MyParentComponent, { childProps: { text: 'hello' } }],
        ]).then(rendered => {
            expect(root.outerHTML).toBe('<div><div>hello</div></div>');
            expect(rendered).toHaveLength(1);
        });
    });
    it('should render components into an existing DOM', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const [updateSubj] = createSubjects(1);
        const MyComponent = createComponent(
            subscribeToUpdates(updateSubj),
            childTemplate
        );

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            ({ props }) => props,
            parentTemplate
        );

        const root = document.createElement('div');
        root.innerHTML = '<div key="test">test</div>';
        expect(root.outerHTML).toBe('<div><div key="test">test</div></div>');
        const oldChild = root.children[0];
        applyAsGroupAndComplete(updateSubj, render, [
            [root, MyParentComponent, { childProps: { text: 'hello' } }],
        ]).then(rendered => {
            expect(root.outerHTML).toBe('<div><div>hello</div></div>');
            expect(oldChild).not.toEqual(root.children[0]);
            expect(rendered).toHaveLength(1);
        });
    });
    it('should reuse moved child components', () => {
        jest.useFakeTimers();
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        const updateSubj = new ReplaySubject(3);
        const MyComponent = createComponent(
            subscribeToUpdates(updateSubj),
            childTemplate
        );

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                if (_context.flip) {
                    component(MyComponent, '2', _context.childProps[1]);
                    component(MyComponent, '1', _context.childProps[0]);
                } else {
                    component(MyComponent, '1', _context.childProps[0]);
                    component(MyComponent, '2', _context.childProps[1]);
                }
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            ({ props }) => props,
            parentTemplate
        );

        const root = document.createElement('div');
        render(root, MyParentComponent, {
            childProps: [{ text: 'hello' }, { text: 'world' }],
        });
        const firstCompEl = root.childNodes[0];
        const secondCompEl = root.childNodes[1];
        expect(root.outerHTML).toEqual(
            '<div><div>hello</div><div>world</div></div>'
        );
        applyAsGroupAndComplete(updateSubj, render, [
            [
                root,
                MyParentComponent,
                {
                    flip: true,
                    childProps: [{ text: 'hello' }, { text: 'world' }],
                },
            ],
        ]).then(rendered => {
            expect(root.outerHTML).toEqual(
                '<div><div>world</div><div>hello</div></div>'
            );
            expect(rendered).toHaveLength(2);
            expect(firstCompEl).toEqual(root.childNodes[1]);
            expect(secondCompEl).toEqual(root.childNodes[0]);
        });
    });
    it('should render existing components into an existing DOM', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const [updateSubj] = createSubjects(1);
        const MyComponent = createComponent(
            subscribeToUpdates(updateSubj),
            childTemplate
        );

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            ({ props }) => props,
            parentTemplate
        );

        const root = document.createElement('div');
        root.innerHTML = '<div key="test">test</div>';
        expect(root.outerHTML).toBe('<div><div key="test">test</div></div>');
        const oldChild = root.children[0];
        applyAsGroupAndComplete(updateSubj, render, [
            [root, MyParentComponent, { childProps: { text: 'hello' } }],
        ]).then(rendered => {
            expect(root.outerHTML).toBe('<div><div>hello</div></div>');
            expect(oldChild.parentNode).toBe(null);
            expect(oldChild).not.toEqual(root.children[0]);
            expect(rendered).toHaveLength(1);
        });
    });
    it('should trigger unmount callback when a Component is removed', () => {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                elementOpen('p', null, null);
                text(_context.text);
                elementClose('p');
                elementOpen('span');
                text('foo');
                elementClose('span');
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const unmountedSubj = new ReplaySubject(2);
        const MyComponent = createComponent(({ props, updates }) => {
            updates.pipe(last()).subscribe(...next(unmountedSubj));
            return props;
        }, template);

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(MyComponent, 'test', { text: 'hello' });
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true });
        flush();
        expect(root.innerHTML).toBe('<div><p>hello</p><span>foo</span></div>');

        applyAsGroupAndComplete(unmountedSubj, patchOuter, [
            [root, renderTemplate, { comp: false }],
        ]).then(unmounted => {
            flush();
            expect(root.innerHTML).toBe('');
            expect(unmounted).toHaveLength(1);
        });
    });
    it('should trigger unmount callback when a Component is removed within an element', () => {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const unmountedSubj = new ReplaySubject(2);
        const MyComponent = createComponent(({ props, updates }) => {
            updates.pipe(last()).subscribe(...next(unmountedSubj));
            return props;
        }, template);

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                elementOpen('div');
                component(MyComponent, 'test', { text: 'hello' });
                elementClose('div');
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true });
        flush();
        expect(root.innerHTML).toBe('<div><div>hello</div></div>');

        applyAsGroupAndComplete(unmountedSubj, patchOuter, [
            [root, renderTemplate, { comp: false }],
        ]).then(unmounted => {
            flush();
            expect(root.innerHTML).toBe('');
            expect(unmounted).toHaveLength(1);
        });
    });
    it('should trigger unmount callback for child components when a Component is removed', () => {
        let MyComponent;
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                if (_context.comp) {
                    component(MyComponent, 'child', {
                        text: 'world',
                        comp: false,
                    });
                }
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const unmouuntedSubj = new ReplaySubject(3);
        MyComponent = createComponent(({ props, updates }) => {
            updates.pipe(last()).subscribe(...next(unmouuntedSubj));
            return props;
        }, template);

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(MyComponent, 'test', { text: 'hello', comp: true });
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true });
        flush();
        expect(root.innerHTML).toBe('<div>hello<div>world</div></div>');
        applyAsGroupAndComplete(unmouuntedSubj, patchOuter, [
            [root, renderTemplate, { comp: false }],
        ]).then(unmounted => {
            flush();
            expect(unmounted).toHaveLength(2);
            expect(root.innerHTML).toBe('');
        });
    });
    it('should trigger unmount callback for deep nested child components when a Component is removed', () => {
        const mounted = { inner: 0, middle: 0, outer: 0 };
        const root = document.createElement('div');
        const subscribeTo = type => ({ props, updates }) => {
            updates.pipe(first()).subscribe(() => {
                mounted[type]++;
            });
            updates.pipe(last()).subscribe(() => mounted[type]--);
            return props;
        };

        const InnerComponent = createComponent(subscribeTo('inner'), {
            render(_context) {
                elementOpen('div', null, null);
                elementClose('div');
            },
        });

        const MiddleComponent = createComponent(subscribeTo('middle'), {
            render(_context) {
                elementOpen('div', null, null);
                component(InnerComponent, 'child', { inner: true });
                elementClose('div');
            },
        });

        const OuterComponent = createComponent(subscribeTo('outer'), {
            render(_context) {
                elementOpen('div', null, null);
                component(MiddleComponent, 'child', {});
                elementClose('div');
            },
        });

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(OuterComponent, 'test', {});
            }
            elementClose('div');
        };
        patchOuter(root, renderTemplate, { comp: true });
        flush();
        expect(mounted).toEqual({ inner: 1, middle: 1, outer: 1 });
        expect(root.innerHTML).toBe('<div><div><div></div></div></div>');

        patchOuter(root, renderTemplate, { comp: false });
        flush();
        expect(mounted).toEqual({ inner: 0, middle: 0, outer: 0 });
        expect(root.innerHTML).toBe('');
    });
    it('should trigger mount callback once even for nested components', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        const mountedSubj = new ReplaySubject(2);
        const MyComponent = createComponent(({ props, updates }) => {
            updates.pipe(first()).subscribe(...next(mountedSubj));
            return props;
        }, childTemplate);

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, 'MyComponent', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            ({ props }) => props,
            parentTemplate
        );

        const root = document.createElement('div');
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        expect(root.outerHTML).toBe('<div><div>hello</div></div>');

        applyAsGroupAndComplete(mountedSubj, render, [
            [root, MyParentComponent, { childProps: { text: 'test' } }],
        ]).then(mounted => {
            expect(mounted).toHaveLength(1);
            expect(root.outerHTML).toBe('<div><div>test</div></div>');
        });
    });
});
