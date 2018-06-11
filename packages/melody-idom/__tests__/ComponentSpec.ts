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
import {
    patch,
    elementOpen,
    text,
    component,
    elementClose,
    enqueueComponent,
    flush,
    mount,
    link,
    getParent,
    options,
} from '../src';
import { getChildren } from '../src/hierarchy';

describe('component', function() {
    let unmounted = false;
    let notified = false;
    let el = null;

    beforeEach(function() {
        unmounted = false;
        notified = false;
        el = document.createElement('div');
    });

    class Component {
        constructor() {
            this.el = null;
            this.refs = Object.create(null);
            this.props = null;
        }

        apply(props) {
            this.props = props;
            enqueueComponent(this);
        }

        notify() {
            notified = true;
        }

        componentWillUnmount() {
            unmounted = true;
        }

        render() {
            elementOpen('div');
            text(this.props.text);
            elementClose('div');
        }
    }

    class ParentComponent extends Component {
        render() {
            elementOpen('section');
            component(Component, 'child1', this.props.firstChild);
            component(Component, 'child2', this.props.secondChild);
            elementClose('section');
        }
    }

    it('should render the component', function() {
        patch(
            el,
            data => {
                component(Component, 'test', data);
            },
            { text: 'Hello' }
        );
        expect(el.innerHTML).toEqual('<m-placeholder></m-placeholder>');
        run();
        expect(el.innerHTML).toEqual('<div>Hello</div>');
        expect(unmounted).toEqual(false);
    });

    it('should mount the component', function() {
        patch(
            el,
            data => {
                mount(el, Component, data);
            },
            { text: 'Hello' }
        );
        run();
        expect(el.outerHTML).toEqual('<div>Hello</div>');
    });

    it('should notify the component', function() {
        patch(
            el,
            data => {
                component(Component, 'test', data);
            },
            { text: 'Hello' }
        );
        run();
        expect(notified).toEqual(true);
    });

    it('should invoke componentWillUnmount when the component is removed', function() {
        patch(
            el,
            data => {
                component(Component, 'test', data);
            },
            { text: 'Hello' }
        );
        run();
        patch(
            el,
            data => {
                elementOpen('div');
                elementClose('div');
            },
            { text: 'Hello' }
        );
        expect(unmounted).toEqual(true);
    });

    it('should render in multiple stages', function() {
        // initial rendering happens immediately
        patch(
            el,
            data => {
                component(ParentComponent, 'test', {
                    firstChild: { text: 'Hello' },
                    secondChild: { text: 'World' },
                });
            },
            {}
        );
        expect(el.innerHTML).toEqual('<m-placeholder></m-placeholder>');
        run(1);
        expect(el.innerHTML).toEqual(
            '<section><div>Hello</div><div>World</div></section>'
        );

        patch(
            el,
            data => {
                component(ParentComponent, 'test', {
                    firstChild: { text: 'hello' },
                    secondChild: { text: 'universe' },
                });
            },
            {}
        );
        run(1);
        // Updates outer element
        expect(el.innerHTML).toEqual(
            '<section><div>Hello</div><div>World</div></section>'
        );
        run(1);
        // updates first child component
        expect(el.innerHTML).toEqual(
            '<section><div>hello</div><div>World</div></section>'
        );
        run(1);
        // updates second child component
        expect(el.innerHTML).toEqual(
            '<section><div>hello</div><div>universe</div></section>'
        );
    });

    it('should render synchronously', function() {
        // activate synchronous rendering option
        options.experimentalSyncDeepRendering = true;

        // initial rendering happens immediately
        patch(
            el,
            data => {
                component(ParentComponent, 'test', {
                    firstChild: { text: 'Hello' },
                    secondChild: { text: 'World' },
                });
            },
            {}
        );
        expect(el.innerHTML).toEqual('<m-placeholder></m-placeholder>');
        run(1);
        expect(el.innerHTML).toEqual(
            '<section><div>Hello</div><div>World</div></section>'
        );

        patch(
            el,
            data => {
                component(ParentComponent, 'test', {
                    firstChild: { text: 'hello' },
                    secondChild: { text: 'universe' },
                });
            },
            {}
        );
        run(1);
        // updates outer element, first and second child component synchronously
        expect(el.innerHTML).toEqual(
            '<section><div>hello</div><div>universe</div></section>'
        );

        // deactivate synchronous rendering option
        options.experimentalSyncDeepRendering = false;
    });

    it('should render new hierachies immediately', function() {
        patch(
            el,
            data => {
                component(ParentComponent, 'test', {
                    firstChild: { text: 'Hello' },
                    secondChild: { text: 'World' },
                });
            },
            {}
        );
        run(1);
        expect(el.innerHTML).toEqual(
            '<section><div>Hello</div><div>World</div></section>'
        );
    });

    it('should mount existing DOM in multiple stages', function() {
        el.innerHTML =
            '<section key="test"><div key="child1">Hello</div><div key="child2">World</div></section>';

        patch(
            el,
            data => {
                component(ParentComponent, 'test', {
                    firstChild: { text: 'hello' },
                    secondChild: { text: 'universe' },
                });
            },
            {}
        );
        run(1);
        // Updates outer element
        expect(el.innerHTML).toEqual(
            '<section><div key="child1">Hello</div><div key="child2">World</div></section>'
        );
        run(1);
        // updates first child component
        expect(el.innerHTML).toEqual(
            '<section><div>hello</div><div key="child2">World</div></section>'
        );
        run(1);
        // updates second child component
        expect(el.innerHTML).toEqual(
            '<section><div>hello</div><div>universe</div></section>'
        );
    });

    it('should continue rendering', function() {
        jest.useFakeTimers();
        patch(
            el,
            data => {
                component(ParentComponent, 'test', {
                    firstChild: { text: 'Hello' },
                    secondChild: { text: 'World' },
                });
            },
            {}
        );
        expect(el.innerHTML).toEqual('<m-placeholder></m-placeholder>');
        run(1);
        jest.runAllTimers();
        expect(el.innerHTML).toEqual(
            '<section><div>Hello</div><div>World</div></section>'
        );
    });

    it('should link parent and children', function() {
        const a = new Component();
        const b = new Component();
        link(a, b);
        expect(getParent(b)).toBe(a);
        expect(getChildren(a)).toEqual([b]);
    });
});

function run(rounds = 1) {
    for (var i = 0; i < rounds; i++) {
        flush({
            didTimeout: false,
            timeRemaining() {
                return 0;
            },
        });
    }
}
