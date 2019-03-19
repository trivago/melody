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
import { render, unmountComponentAtNode } from 'melody-component';
import {
    elementOpen,
    elementClose,
    text,
    component,
    patchOuter,
} from 'melody-idom';
import { createComponent, useEffect, useEffectOnce, useState } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
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
        const createHashtagComponent = createComponent(props => ({
            value: `#${props.value}`,
        }));
        const SpanHashtagComponent = createHashtagComponent(template1);
        const DivHashtagComponent = createHashtagComponent(template2);

        const root1 = document.createElement('div');
        render(root1, SpanHashtagComponent, { value: 'foo' });

        const root2 = document.createElement('div');
        render(root2, DivHashtagComponent, { value: 'foo' });
    });
    it('should rerender when props have changed', () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(({ value }) => {
            called++;
            return { value };
        }, template);
        render(root, MyComponent, { value: 'foo' });
        render(root, MyComponent, { value: 'bar' });
        expect(called).toEqual(2);
    });
    it("should not rerender when props haven't changed", () => {
        const root = document.createElement('div');
        let called = 0;
        const MyComponent = createComponent(({ value }) => {
            called++;
            return { value };
        }, template);
        render(root, MyComponent, { value: 'foo' });
        render(root, MyComponent, { value: 'foo' });
        expect(called).toEqual(1);
    });
    it("should not rerender children when props haven't changed", () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text('Hello');
                elementClose('div');
            },
        };

        let childCalled = 0;
        const MyComponent = createComponent(props => {
            childCalled++;
        }, childTemplate);

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4');
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            props => props,
            parentTemplate
        );

        const root = document.createElement('div');
        render(root, MyParentComponent);
        render(root, MyParentComponent);
        expect(childCalled).toEqual(1);
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
        const MyComponent = createComponent(props => props, template);
        const MyOtherComponent = createComponent(props => props, template);

        render(root, MyComponent, { text: 'hello' });
        expect(root.outerHTML).toEqual('<div>hello</div>');

        render(root, MyOtherComponent, { text: 'test' });
        expect(root.outerHTML).toEqual('<div>test</div>');
    });
    it('should unmount replaced components', () => {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let unmounted = 0;
        const MyComponent = createComponent(({ text }) => {
            useEffect(() => () => {
                unmounted++;
            });
            return { text };
        }, template);
        const MyOtherComponent = createComponent(props => props, template);

        render(root, MyComponent, { text: 'hello' });
        expect(root.outerHTML).toEqual('<div>hello</div>');

        render(root, MyOtherComponent, { text: 'test' });
        expect(root.outerHTML).toEqual('<div>test</div>');
        expect(unmounted).toEqual(1);
    });
    it('should render components into an existing DOM', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(props => {
            useEffectOnce(() => {
                mounted++;
                if (mounted === 3) {
                    throw new Error('gotcha!');
                }
            });
            return props;
        }, childTemplate);

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '3', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            props => props,
            parentTemplate
        );

        const root = document.createElement('div');
        root.innerHTML = '<div>test</div>';
        expect(root.outerHTML).toEqual('<div><div>test</div></div>');
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        expect(root.outerHTML).toEqual('<div><div>hello</div></div>');
        expect(mounted).toEqual(1);
    });
    it('should render components into an existing DOM', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(props => {
            useEffectOnce(() => {
                mounted++;
                if (mounted === 3) {
                    throw new Error('gotcha!');
                }
            });
            return props;
        }, childTemplate);

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            props => props,
            parentTemplate
        );

        const root = document.createElement('div');
        root.innerHTML = '<div key="test">test</div>';
        expect(root.outerHTML).toEqual('<div><div key="test">test</div></div>');
        const oldChild = root.children[0];
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        expect(root.outerHTML).toEqual('<div><div>hello</div></div>');
        expect(mounted).toEqual(1);
        expect(oldChild).not.toEqual(root.children[0]);
        // 'Previous child no longer has a parent'
        expect(oldChild.parentNode).toBeNull();
    });
    it('should reuse moved child components', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(props => {
            useEffectOnce(() => {
                mounted++;
                if (mounted === 3) {
                    throw new Error('gotcha!');
                }
            });
            return props;
        }, childTemplate);

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
            props => props,
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
        expect(mounted).toEqual(2);

        render(root, MyParentComponent, {
            flip: true,
            childProps: [{ text: 'hello' }, { text: 'world' }],
        });
        expect(root.outerHTML).toEqual(
            '<div><div>world</div><div>hello</div></div>'
        );
        expect(firstCompEl).toEqual(root.childNodes[1]);
        expect(secondCompEl).toEqual(root.childNodes[0]);
        expect(mounted).toEqual(2);
    });
    it('should render existing components into an existing DOM', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(props => {
            useEffectOnce(() => {
                mounted++;
            });
            return props;
        }, childTemplate);

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            props => props,
            parentTemplate
        );

        const root = document.createElement('div');
        root.innerHTML = '<div key="test">test</div>';
        expect(root.outerHTML).toEqual('<div><div key="test">test</div></div>');
        const oldChild = root.children[0];
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        expect(root.outerHTML).toEqual('<div><div>hello</div></div>');
        expect(mounted).toEqual(1);
        expect(oldChild).not.toEqual(root.children[0]);
        // 'Previous child no longer has a parent'
        expect(oldChild.parentNode).toBeNull();
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
        let unmounted = 0;
        const MyComponent = createComponent(props => {
            useEffectOnce(() => () => {
                unmounted++;
            });
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
        expect(root.innerHTML).toEqual(
            '<div><p>hello</p><span>foo</span></div>'
        );
        expect(unmounted).toEqual(0);

        patchOuter(root, renderTemplate, { comp: false });
        flush();
        expect(root.innerHTML).toEqual('');
        expect(unmounted).toEqual(1);
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
        let unmounted = 0;
        const MyComponent = createComponent(props => {
            useEffectOnce(() => () => {
                unmounted++;
            });
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
        expect(root.innerHTML).toEqual('<div><div>hello</div></div>');
        expect(unmounted).toEqual(0);

        patchOuter(root, renderTemplate, { comp: false });
        flush();
        expect(root.innerHTML).toEqual('');
        expect(unmounted).toEqual(1);
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
        let mounted = 0;
        MyComponent = createComponent(props => {
            useEffectOnce(() => {
                mounted++;
                return () => {
                    mounted--;
                };
            });
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
        expect(root.innerHTML).toEqual('<div>hello<div>world</div></div>');
        expect(mounted).toEqual(2);

        patchOuter(root, renderTemplate, { comp: false });
        flush();
        expect(root.innerHTML).toEqual('');
        expect(mounted).toEqual(0);
    });
    it('should trigger unmount callback for deep nested child components when a Component is removed', () => {
        const mounted = { inner: 0, middle: 0, outer: 0 };
        const root = document.createElement('div');
        const CountInstances = name => props => {
            useEffectOnce(() => {
                mounted[name]++;
                return () => {
                    mounted[name]--;
                };
            });
            return props;
        };

        const InnerComponent = createComponent(CountInstances('inner'), {
            render(_context) {
                elementOpen('div', null, null);
                elementClose('div');
            },
        });

        const MiddleComponent = createComponent(CountInstances('middle'), {
            render(_context) {
                elementOpen('div', null, null);
                component(InnerComponent, 'child', { inner: true });
                elementClose('div');
            },
        });

        const OuterComponent = createComponent(CountInstances('outer'), {
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
        expect(root.innerHTML).toEqual('<div><div><div></div></div></div>');
        expect(mounted.inner).toEqual(1);
        expect(mounted.middle).toEqual(1);
        expect(mounted.outer).toEqual(1);

        patchOuter(root, renderTemplate, { comp: false });
        flush();
        expect(root.innerHTML).toEqual('');
        expect(mounted.inner).toEqual(0);
        expect(mounted.middle).toEqual(0);
        expect(mounted.outer).toEqual(0);
    });
    it('should trigger unmount callback for deep nested child components when a Component is removed', () => {
        const mounted = { innermost: 0, inner: 0, middle: 0, outer: 0 };
        const root = document.createElement('div');
        const CountInstances = name => props => {
            useEffectOnce(() => {
                mounted[name]++;
                return () => {
                    mounted[name]--;
                };
            });
            return props;
        };

        const InnerMostComponent = createComponent(
            CountInstances('innermost'),
            {
                render(_context) {
                    elementOpen('div', null, null);
                    elementClose('div');
                },
            }
        );

        const InnerComponent = createComponent(CountInstances('inner'), {
            render(_context) {
                elementOpen('div', null, null);
                component(InnerMostComponent, 'child', {});
                elementClose('div');
            },
        });

        const MiddleComponent = createComponent(CountInstances('middle'), {
            render(_context) {
                elementOpen('div', null, null);
                component(InnerComponent, 'child', {});
                elementClose('div');
            },
        });

        const OuterComponent = createComponent(CountInstances('outer'), {
            render(_context) {
                elementOpen('div', null, null);
                if (_context.comp) {
                    component(MiddleComponent, 'child', {});
                }
                elementClose('div');
            },
        });

        render(root, OuterComponent, { comp: true });
        expect(root.innerHTML).toEqual('<div><div><div></div></div></div>');
        expect(mounted.inner).toEqual(1);
        expect(mounted.middle).toEqual(1);
        expect(mounted.outer).toEqual(1);

        render(root, OuterComponent, { comp: false });
        expect(root.innerHTML).toEqual('');
        expect(mounted.inner).toEqual(0);
        expect(mounted.middle).toEqual(0);
        expect(mounted.outer).toEqual(1);
    });

    it('should trigger mount callback once even for nested components', () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(props => {
            useEffectOnce(() => {
                mounted++;
            });
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
            props => props,
            parentTemplate
        );

        const root = document.createElement('div');
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        expect(root.outerHTML).toEqual('<div><div>hello</div></div>');
        expect(mounted).toEqual(1);

        render(root, MyParentComponent, { childProps: { text: 'test' } });
        expect(root.outerHTML).toEqual('<div><div>test</div></div>');
        expect(mounted).toEqual(1);
    });
    it('should not throw when calling setState after the component has been unmounted', () => {
        const root = document.createElement('div');
        let rerender;
        const MyComponent = createComponent(() => {
            rerender = useState()[1];
        }, template);
        render(root, MyComponent);
        unmountComponentAtNode(root);
        /* eslint-disable no-console */
        const temp = console.warn;
        console.warn = jest.fn();
        rerender('foo');
        expect(console.warn).toHaveBeenCalledWith(
            'useState: a `setState` handler has been called even though the component was already unmounted. This is probably due to a missing `unsubscribe` callback of a `useEffect` or `useMutationEffect` hook.'
        );
        console.warn = temp;
        /* eslint-enable no-console */
    });
    it('should recover from errors in the component function', () => {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.value);
                elementClose('div');
            },
        };

        const root = document.createElement('div');
        const MyComponent = createComponent(props => {
            if (!props.value) throw new Error('Foo');
            const [foo] = useState(1337);
            const [bar] = useState(1337);
            return {
                ...props,
                foo,
                bar,
            };
        }, template);

        render(root, MyComponent, { value: 'foo' });
        expect(root.outerHTML).toEqual('<div>foo</div>');
        expect(() => {
            render(root, MyComponent);
        }).toThrow();
        expect(root.outerHTML).toEqual('<div>foo</div>');
        render(root, MyComponent, { value: 'foo' });
        expect(root.outerHTML).toEqual('<div>foo</div>');
    });
});
