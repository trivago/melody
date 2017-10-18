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
import { createStore } from 'redux';
import { createComponent, render } from 'melody-component';
import { component, elementOpen, elementClose, text, flush } from 'melody-idom';
import { connect, provide } from '../src';

// When trying to reproduce another bug, I found this where
// component['MELODY/DATA'] is undefined
it('should work when connected component is not rendered through typical render pipeline', done => {
    const store = createStore((state = ['child0'], action) => {
        if (action.type === 'REFRESH') {
            return state.concat();
        }
        return state;
    });

    const childTemplate = {
        render() {
            elementOpen('span');
            text('child');
            elementClose('span');
        },
    };

    const ChildComponent = createComponent(childTemplate, null, () => ({
        componentShouldUpdate(nextProps, nextState) {
            return nextState !== this.state;
        },
    }));

    const ConnectedChild = connect(() => ({}))(ChildComponent);

    const parentTemplate = {
        render(_context) {
            elementOpen('li');
            _context.children.forEach(child => {
                component(ConnectedChild, child);
            });
            elementClose('li');
        },
    };

    const ParentComponent = createComponent(parentTemplate, undefined);

    const App = createComponent({
        render(_context) {
            elementOpen('ol');
            component(ParentComponent, 'parent', {
                children: _context.children,
            });
            elementClose('ol');
        },
    });

    const ConnectedApp = connect(state => ({
        children: state,
    }))(App);

    const ProvidedApp = provide(store, ConnectedApp);

    const root = document.createElement('ol');

    render(root, ProvidedApp);
    assert.equal(root.outerHTML, '<ol><li><span>child</span></li></ol>');
    store.dispatch({ type: 'REFRESH' });
    // setTimeout(() => {
    assert.equal(root.outerHTML, '<ol><li><span>child</span></li></ol>');
    done();
    // }, 500);
});

it('should not delete child component if child did not need rendering', done => {
    const store = createStore((state = ['child0'], action) => {
        if (action.type === 'REFRESH') {
            return state.concat();
        }
        return state;
    });

    const childTemplate = {
        render(_context) {
            elementOpen('span');
            text(_context.length);
            elementClose('span');
        },
    };

    const ChildComponent = createComponent(childTemplate, null, () => ({
        shouldComponentUpdate(nextProps, nextState) {
            return this.state.length !== nextState.length;
        },
    }));

    const ConnectedChild = connect(state => ({
        children: state,
        length: state.length,
    }))(ChildComponent);

    const parentTemplate = {
        render(_context) {
            elementOpen('li');
            _context.children.forEach(child => {
                component(ConnectedChild, child, {});
            });
            elementClose('li');
        },
    };

    const ParentComponent = createComponent(parentTemplate);

    const ProvidedApp = provide(store, ParentComponent);

    const root = document.createElement('li');

    render(root, ProvidedApp, { children: store.getState() });
    assert.equal(root.outerHTML, '<li><span>1</span></li>');

    // trigger dispatch on ConnectedChild
    // ParentComponent does not receive a dispatch

    // ConnectedChild is rendered using renderComponent
    // ChildComponent is rendered through renderTemplate
    // ChildComponent does not need rendering (shouldComponentUpdate)
    // ConnectedChild deletes ChildComponent (delete unvisited nodes)
    store.dispatch({ type: 'REFRESH' });
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
    assert.equal(root.outerHTML, '<li><span>1</span></li>');
    done();
});
