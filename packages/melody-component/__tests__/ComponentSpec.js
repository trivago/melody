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
import { assert } from 'chai';

import { createComponent, RECEIVE_PROPS, render } from '../src';
import {
    patch,
    patchOuter,
    flush,
    component,
    ref,
    elementOpen,
    elementClose,
    text,
} from 'melody-idom';

describe('Component', function() {
    it('should trigger componentDidMount once', function() {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let mounted = 0;
        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                mounted++;
            },
        });

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');
        assert.equal(mounted, 1);

        render(root, MyComponent, { text: 'test' });
        assert.equal(root.outerHTML, '<div>test</div>');
        assert.equal(mounted, 1);
    });

    it('mixins can be applied with a curried function', function() {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let mounted = 0;
        const MyComponent = createComponent(template)({
            componentDidMount() {
                mounted++;
            },
        });

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');
        assert.equal(mounted, 1);

        render(root, MyComponent, { text: 'test' });
        assert.equal(root.outerHTML, '<div>test</div>');
        assert.equal(mounted, 1);
    });

    it('mixins can be applied arbitrarily often with a curried function', function() {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const mounted = [0, 0, 0];

        const countMounting = idx => ({ componentDidMount }) => ({
            componentDidMount() {
                componentDidMount.call(this);
                mounted[idx]++;
            },
        });

        const MyComponent = createComponent(template)(countMounting(0))(
            countMounting(1),
        )(countMounting(2));

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');
        assert.equal(mounted[0], 1);
        assert.equal(mounted[1], 1);
        assert.equal(mounted[2], 1);

        render(root, MyComponent, { text: 'test' });
        assert.equal(root.outerHTML, '<div>test</div>');
        assert.equal(mounted[0], 1);
        assert.equal(mounted[1], 1);
        assert.equal(mounted[2], 1);
    });

    it('should trigger componentWillUnmount when a Component is removed', function() {
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
        const MyComponent = createComponent(template, undefined, {
            componentWillUnmount() {
                unmounted++;
            },
        });

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(MyComponent, 'test', { text: 'hello' });
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '<div><p>hello</p><span>foo</span></div>');
        assert.equal(unmounted, 0);

        patchOuter(root, renderTemplate, { comp: false });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '');
        assert.equal(unmounted, 1);
    });

    it('should trigger componentWillUnmount when a Component is removed within an element', function() {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let unmounted = 0;
        const MyComponent = createComponent(template, undefined, {
            componentWillUnmount() {
                unmounted++;
            },
        });

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
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '<div><div>hello</div></div>');
        assert.equal(unmounted, 0);

        patchOuter(root, renderTemplate, { comp: false });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '');
        assert.equal(unmounted, 1);
    });

    it('should trigger componentWillUnmount for child components when a Component is removed', function() {
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
        let unmounted = 0;
        MyComponent = createComponent(template)({
            componentDidMount() {
                unmounted++;
            },
            componentWillUnmount() {
                unmounted--;
            },
        });

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(MyComponent, 'test', { text: 'hello', comp: true });
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '<div>hello<div>world</div></div>');
        assert.equal(unmounted, 2);

        patchOuter(root, renderTemplate, { comp: false });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '');
        assert.equal(unmounted, 0);
    });

    it('should trigger componentWillUnmount for deep nested child components when a Component is removed', function() {
        let unmounted = { inner: 0, middle: 0, outer: 0 };
        const root = document.createElement('div');
        const CountInstances = {
            componentDidMount() {
                unmounted[this.name]++;
            },
            componentWillUnmount() {
                unmounted[this.name]--;
            },
        };

        const InnerComponent = createComponent({
            render(_context) {
                elementOpen('div', null, null);
                elementClose('div');
            },
        })({ name: 'inner' }, CountInstances);

        const MiddleComponent = createComponent({
            render(_context) {
                elementOpen('div', null, null);
                component(InnerComponent, 'child', { inner: true });
                elementClose('div');
            },
        })({ name: 'middle' }, CountInstances);

        const OuterComponent = createComponent({
            render(_context) {
                elementOpen('div', null, null);
                component(MiddleComponent, 'child', {});
                elementClose('div');
            },
        })({ name: 'outer' }, CountInstances);

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(OuterComponent, 'test', {});
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '<div><div><div></div></div></div>');
        assert.equal(unmounted.inner, 1);
        assert.equal(unmounted.middle, 1);
        assert.equal(unmounted.outer, 1);

        patchOuter(root, renderTemplate, { comp: false });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.innerHTML, '');
        assert.equal(unmounted.inner, 0);
        assert.equal(unmounted.middle, 0);
        assert.equal(unmounted.outer, 0);
    });

    it('should trigger componentWillUnmount for deep nested child components when a Component is removed', function() {
        let unmounted = { innermost: 0, inner: 0, middle: 0, outer: 0 };
        const root = document.createElement('div');
        const CountInstances = {
            componentDidMount() {
                unmounted[this.name]++;
            },
            componentWillUnmount() {
                unmounted[this.name]--;
            },
        };

        const InnerMostComponent = createComponent({
            render(_context) {
                elementOpen('div', null, null);
                elementClose('div');
            },
        })({ name: 'innermost' }, CountInstances);

        const InnerComponent = createComponent({
            render(_context) {
                elementOpen('div', null, null);
                component(InnerMostComponent, 'child', {});
                elementClose('div');
            },
        })({ name: 'inner' }, CountInstances);

        const MiddleComponent = createComponent({
            render(_context) {
                elementOpen('div', null, null);
                component(InnerComponent, 'child', {});
                elementClose('div');
            },
        })({ name: 'middle' }, CountInstances);

        const OuterComponent = createComponent({
            render(_context) {
                elementOpen('div', null, null);
                if (_context.comp) {
                    component(MiddleComponent, 'child', {});
                }
                elementClose('div');
            },
        })({ name: 'outer' }, CountInstances);

        render(root, OuterComponent, { comp: true });
        assert.equal(root.innerHTML, '<div><div><div></div></div></div>');
        assert.equal(unmounted.inner, 1);
        assert.equal(unmounted.middle, 1);
        assert.equal(unmounted.outer, 1);

        render(root, OuterComponent, { comp: false });
        assert.equal(root.innerHTML, '');
        assert.equal(unmounted.inner, 0);
        assert.equal(unmounted.middle, 0);
        assert.equal(unmounted.outer, 1);
    });

    it('should register refs', function() {
        const statics = ['ref', ref('fun')];
        const template = {
            render(_context) {
                elementOpen('div', null, statics);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                assert(this.refs.fun != null, 'fun ref should exist');
                this.refs.fun.innerHTML = 'test';
            },

            componentDidUpdate(prevProps, prevState) {
                expect(this.el.outerHTML).toEqual('<div>world</div>');
                this.refs.fun.innerHTML = 'fun!';
                assert(prevState !== this.state);
                expect(prevProps).not.toEqual(this.props);
                assert(prevState.text === 'hello');
                assert(prevProps.text === 'hello');
                assert.equal(this.state.text, 'world');
                assert.equal(this.props.text, 'world');
            },
        });

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>test</div>');

        render(root, MyComponent, { text: 'world' });
        assert.equal(root.outerHTML, '<div>fun!</div>');
    });

    it('should register refs for the current element', function() {
        const statics = ['ref', ref('fun')];
        const template = {
            render(_context) {
                elementOpen('div', null, statics);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                assert(this.refs.fun != null, 'fun ref should exist');
                this.refs.fun.innerHTML = 'test';
            },
        });

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>test</div>');
    });

    it('should throw when registering a ref outside of a component', function() {
        const root = document.createElement('div');
        const statics = ['ref', ref('test')];
        assert.throws(() => {
            patch(root, () => {
                elementOpen('div', null, statics);
                text('test');
                elementClose('div');
            });
        }, 'ref() must be used within a component');
    });

    it('should trigger componentDidMount once even for nested components', function() {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(childTemplate, undefined, {
            componentDidMount() {
                mounted++;
                assert(this.el != null, 'Element should exists');
            },
        });

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, 'MyComponent', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(parentTemplate);

        const root = document.createElement('div');
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        assert.equal(root.outerHTML, '<div><div>hello</div></div>');
        assert.equal(mounted, 1);

        render(root, MyParentComponent, { childProps: { text: 'test' } });
        assert.equal(root.outerHTML, '<div><div>test</div></div>');
        assert.equal(mounted, 1);
    });

    it('should have an element during componentDidMount', function() {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let mounted = 0;
        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                mounted++;
                assert.equal(this.el, root, 'Element should be set');
            },
        });

        render(root, MyComponent, { text: 'hello' });
        assert.equal(mounted, 1);
    });

    it('should not render if data is unchanged', function() {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const MyComponent = createComponent(template);
        const props = { text: 'hello' };
        render(root, MyComponent, props);
        assert.equal(root.innerHTML, 'hello');
        props.text = 'world';
        render(root, MyComponent, props);
        assert.equal(root.innerHTML, 'hello');
    });

    it('should mount onto an element without a key', function() {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const MyComponent = createComponent(template);

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');

        render(root, MyComponent, { text: 'test' });
        assert.equal(root.outerHTML, '<div>test</div>');
    });

    it('should replace components', function() {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const MyComponent = createComponent(template);
        const MyOtherComponent = createComponent(template);

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');

        render(root, MyOtherComponent, { text: 'test' });
        assert.equal(root.outerHTML, '<div>test</div>');
    });

    it('should unmount replaced components', function() {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let unmounted = 0;
        const MyComponent = createComponent(template, undefined, {
            componentWillUnmount() {
                unmounted++;
            },
        });
        const MyOtherComponent = createComponent(template);

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');

        render(root, MyOtherComponent, { text: 'test' });
        assert.equal(root.outerHTML, '<div>test</div>');
        assert.equal(unmounted, 1);
    });

    it('should render components into an existing DOM', function() {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(childTemplate, undefined, {
            componentDidMount() {
                mounted++;
                if (mounted === 3) {
                    throw new Error('gotcha!');
                }
            },
        });

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '3', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(parentTemplate);

        const root = document.createElement('div');
        root.innerHTML = '<div>test</div>';
        assert.equal(root.outerHTML, '<div><div>test</div></div>');
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        assert.equal(root.outerHTML, '<div><div>hello</div></div>');
        assert.equal(mounted, 1);
    });

    it('should render components into an existing DOM', function() {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(childTemplate, undefined, {
            componentDidMount() {
                mounted++;
                if (mounted === 3) {
                    throw new Error('gotcha!');
                }
            },
        });

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(parentTemplate);

        const root = document.createElement('div');
        root.innerHTML = '<div key="test">test</div>';
        assert.equal(root.outerHTML, '<div><div key="test">test</div></div>');
        const oldChild = root.children[0];
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        assert.equal(root.outerHTML, '<div><div>hello</div></div>');
        assert.equal(mounted, 1);
        assert.notEqual(oldChild, root.children[0]);
        assert(
            oldChild.parentNode == null,
            'Previous child no longer has a parent',
        );
    });

    it('should reuse moved child components', function() {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(childTemplate, undefined, {
            componentDidMount() {
                mounted++;
                if (mounted === 3) {
                    throw new Error('gotcha!');
                }
            },
        });

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
        const MyParentComponent = createComponent(parentTemplate);

        const root = document.createElement('div');
        render(root, MyParentComponent, {
            childProps: [{ text: 'hello' }, { text: 'world' }],
        });
        const firstCompEl = root.childNodes[0];
        const secondCompEl = root.childNodes[1];
        assert.equal(
            root.outerHTML,
            '<div><div>hello</div><div>world</div></div>',
        );
        assert.equal(mounted, 2);

        render(root, MyParentComponent, {
            flip: true,
            childProps: [{ text: 'hello' }, { text: 'world' }],
        });
        assert.equal(
            root.outerHTML,
            '<div><div>world</div><div>hello</div></div>',
        );
        assert.equal(firstCompEl, root.childNodes[1]);
        assert.equal(secondCompEl, root.childNodes[0]);
        assert.equal(mounted, 2);
    });

    it('should render existing components into an existing DOM', function() {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };

        let mounted = 0;
        const MyComponent = createComponent(childTemplate, undefined, {
            componentDidMount() {
                mounted++;
            },
        });

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4', _context.childProps);
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(parentTemplate);

        const root = document.createElement('div');
        root.innerHTML = '<div key="test">test</div>';
        assert.equal(root.outerHTML, '<div><div key="test">test</div></div>');
        const oldChild = root.children[0];
        render(root, MyParentComponent, { childProps: { text: 'hello' } });
        assert.equal(root.outerHTML, '<div><div>hello</div></div>');
        assert.equal(mounted, 1);
        assert.notEqual(oldChild, root.children[0]);
        assert(
            oldChild.parentNode == null,
            'Previous child no longer has a parent',
        );
    });

    it('should update itself when its state changes', function(done) {
        const template = {
            render(_context) {
                elementOpen('div', null, null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        let comp;
        const MyComponent = createComponent(
            template,
            (state = { text: '' }, action) => {
                if (action.type === 'setText') {
                    return { ...state, text: action.payload };
                } else if (action.type === RECEIVE_PROPS) {
                    comp = action.meta;
                    return { ...state, ...action.payload };
                }
                return state;
            },
        );

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');
        comp.dispatch({ type: 'setText', payload: 'world' });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        assert.equal(root.outerHTML, '<div>world</div>');
        done();
    });
});
