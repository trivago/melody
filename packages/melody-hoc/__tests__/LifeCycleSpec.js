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
import { createComponent, render } from 'melody-component';
import {
    patchOuter,
    elementOpen,
    elementClose,
    ref,
    component,
    flush,
} from 'melody-idom';
import { compose, lifecycle } from '../src';

const template = {
    render(_context) {
        ref('bar', elementOpen('div', null));
        elementClose('div');
    },
};

describe('LifeCycle', function() {
    it('should call lifecycle methods in the correct order', function() {
        const root = document.createElement('div');
        const log = [];

        const enhance = compose(
            lifecycle({
                componentDidInitialize() {
                    log.push(2);
                },
            }),
            lifecycle({
                componentDidInitialize() {
                    log.push(1);
                },
            }),
        );

        const MyComponent = createComponent(template, undefined, {
            componentDidInitialize() {
                log.push(0);
            },
        });

        const EnhancedComponent = enhance(MyComponent);

        render(root, EnhancedComponent, { foo: 'bar' });
        expect(log).toEqual([0, 1, 2]);
    });
    it('should support all lifecycle methods', function() {
        const root = document.createElement('div');
        const log = [];

        const enhance = lifecycle({
            componentDidInitialize() {
                log.push('componentDidInitialize');
            },
            componentWillMount() {
                log.push('componentWillMount');
            },
            componentDidMount() {
                log.push('componentDidMount');
            },
            componentWillUpdate() {
                log.push('componentWillUpdate');
            },
            componentDidUpdate() {
                log.push('componentDidUpdate');
            },
            componentWillUnmount() {
                log.push('componentWillUnmount');
            },
        });

        const MyComponent = createComponent(template);
        const EnhancedComponent = enhance(MyComponent);

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(EnhancedComponent, 'test', { foo: _context.foo });
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true, foo: 'bar' });
        finishRendering();
        patchOuter(root, renderTemplate, { comp: true, foo: 'qux' });
        finishRendering();
        patchOuter(root, renderTemplate, { comp: false });
        finishRendering();
        expect(log).toEqual([
            'componentDidInitialize',
            'componentWillMount',
            'componentDidMount',
            'componentWillUpdate',
            'componentDidUpdate',
            'componentWillUnmount',
        ]);
    });
    it('should bind lifecycle methods to an own context', function() {
        const root = document.createElement('div');
        let lifecycleContext;
        let componentContext;

        const enhance = lifecycle({
            componentDidInitialize() {
                lifecycleContext = this;
            },
        });

        const MyComponent = createComponent(template, undefined, {
            componentDidInitialize() {
                componentContext = this;
            },
        });

        const EnhancedComponent = enhance(MyComponent);

        render(root, EnhancedComponent, { foo: 'bar' });
        expect(lifecycleContext).not.toEqual(componentContext);
    });
    describe('lifecycle context', function() {
        it('should have access to important component properties', function() {
            const root = document.createElement('div');
            let lifecycleContext;
            let componentContext;

            const enhance = lifecycle({
                componentDidMount() {
                    lifecycleContext = this;
                },
            });

            const MyComponent = createComponent(template, undefined, {
                componentDidMount() {
                    componentContext = this;
                },
            });
            const EnhancedComponent = enhance(MyComponent);
            render(root, EnhancedComponent, { foo: 'bar' });
            expect(lifecycleContext.el).toEqual(componentContext.el);
            expect(lifecycleContext.refs).toEqual(componentContext.refs);
            expect(lifecycleContext.props).toEqual(componentContext.props);
            expect(lifecycleContext.state).toEqual(componentContext.state);
            expect(lifecycleContext.dispatch).toBeInstanceOf(Function);
            expect(lifecycleContext.getState).toBeInstanceOf(Function);
        });
        it('should be the same context through all lifecycles', function() {
            const root = document.createElement('div');
            const contexts = [];

            const enhance = lifecycle({
                componentDidInitialize() {
                    contexts.push(this);
                },
                componentWillMount() {
                    contexts.push(this);
                },
                componentDidMount() {
                    contexts.push(this);
                },
                componentWillUpdate() {
                    contexts.push(this);
                },
                componentDidUpdate() {
                    contexts.push(this);
                },
                componentWillUnmount() {
                    contexts.push(this);
                },
            });

            const MyComponent = createComponent(template);
            const EnhancedComponent = enhance(MyComponent);

            const renderTemplate = _context => {
                elementOpen('div');
                if (_context.comp) {
                    component(EnhancedComponent, 'test', { foo: _context.foo });
                }
                elementClose('div');
            };

            patchOuter(root, renderTemplate, { comp: true, foo: 'bar' });
            finishRendering();
            patchOuter(root, renderTemplate, { comp: true, foo: 'qux' });
            finishRendering();
            patchOuter(root, renderTemplate, { comp: false });
            finishRendering();
            expect(contexts[1]).toEqual(contexts[0]);
            expect(contexts[2]).toEqual(contexts[0]);
            expect(contexts[3]).toEqual(contexts[0]);
            expect(contexts[4]).toEqual(contexts[0]);
            expect(contexts[5]).toEqual(contexts[0]);
        });
    });
});

function finishRendering() {
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
}
