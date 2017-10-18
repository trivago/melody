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

import { createComponent, RECEIVE_PROPS, render } from 'melody-component';
import {
    component,
    elementOpen,
    elementClose,
    elementVoid,
    text,
    flush,
} from 'melody-idom';
import { provide, connect } from '../src/';
import { createStore } from 'redux';

function reducer(state = { value: 'foo' }, action) {
    switch (action.type) {
        case 'SET':
            return { value: action.payload };
        default:
            return state;
    }
}

describe('Connect', function() {
    let store;
    beforeEach(() => (store = createStore(reducer)));
    function renderWithProvide(Comp, props) {
        const template = {
            render(_context) {
                elementOpen('div', 'outer');
                component(Comp, 'test', props);
                elementClose('div');
            },
        };
        const App = createComponent(template);
        const ProvidedApp = provide(store, App);
        const root = document.createElement('div');
        render(root, ProvidedApp, {});
        return root;
    }

    describe('without internal state', () => {
        let Component;
        const template = {
            render(_context) {
                elementOpen('div', 'inner');
                text(_context.value);
                elementClose('div');
            },
        };

        beforeEach(() => {
            Component = createComponent(template);
        });

        it('should render component with state from redux store', done => {
            const enhance = connect(state => ({ value: state.value + '!' }));
            const ConnectedComponent = enhance(Component);

            const dom = renderWithProvide(ConnectedComponent);
            assert.equal(dom.outerHTML, '<div><div>foo!</div></div>');
            store.dispatch({ type: 'SET', payload: 'bar' });

            finishRendering();
            assert.equal(dom.outerHTML, '<div><div>bar!</div></div>');
            done();
        });

        it('should support multiple connect higher order components', done => {
            const enhance = connect(state => ({ value: state.value + '!' }));
            const enhance2 = connect(state => ({ value: state.value + '?' }));
            const ConnectedComponent = enhance2(enhance(Component));

            const dom = renderWithProvide(ConnectedComponent);

            assert.equal(dom.outerHTML, '<div><div>foo!</div></div>');
            store.dispatch({ type: 'SET', payload: 'bar' });

            finishRendering();
            assert.equal(dom.outerHTML, '<div><div>bar!</div></div>');
            done();
        });

        it('should support multiple connect higher order components and receive their state as props', done => {
            const enhance = connect((state, props) => ({
                value: props.value + '!',
            }));
            const enhance2 = connect(state => ({ value: state.value + '?' }));
            const ConnectedComponent = enhance2(enhance(Component));

            const dom = renderWithProvide(ConnectedComponent);

            assert.equal(dom.outerHTML, '<div><div>foo?!</div></div>');
            store.dispatch({ type: 'SET', payload: 'bar' });

            finishRendering();
            assert.equal(dom.outerHTML, '<div><div>bar?!</div></div>');
            done();
        });

        // it('should not drop wrapped component when shouldComponentUpdate returns false', done => {
        //   const enhance = connect((state) => ({ value: state.value + '!' }));
        //   const ConnectedComponent = enhance(Component)({
        //     shouldComponentUpdate() {
        //       return false;
        //     }
        //   });

        //   const template = {
        //     render(_context) {
        //       elementOpen('div', 'outer');
        //       component(ConnectedComponent, 'test', {});
        //       elementClose('div');
        //     }
        //   };
        //   const App = createComponent(template);
        //   const ProvidedApp = provide(store, App);
        //   const dom = document.createElement('div');
        //   render(dom, ProvidedApp, { foo: 1 });

        //   assert.equal(dom.outerHTML, '<div><div>foo!</div></div>');
        //   render(dom, ProvidedApp, { foo: 2 });

        //   assert.equal(dom.outerHTML, '<div><div>foo!</div></div>');
        //   done();
        // });

        it('should pass props from connected component to child component', () => {
            const enhance = connect();
            const ConnectedComponent = enhance(Component);

            const dom = renderWithProvide(ConnectedComponent, { value: 'bar' });
            assert.equal(dom.outerHTML, '<div><div>bar</div></div>');
        });

        it('should have higher priority for stateToProps than component props', () => {
            const enhance = connect(state => ({ value: `${state.value}!` }));
            const ConnectedComponent = enhance(Component);

            const dom = renderWithProvide(ConnectedComponent, { value: 'bar' });
            assert.equal(dom.outerHTML, '<div><div>foo!</div></div>');
        });

        it('should map dispatchable action to props', done => {
            const enhance = connect(
                state => {
                    return { value: state.value };
                },
                {
                    setValue: val => {
                        return { type: 'SET', payload: val };
                    },
                },
            );
            let dom;
            const Component = createComponent(
                template,
                null,
                ({ componentDidMount }) => ({
                    componentDidMount() {
                        componentDidMount.call(this);
                        //simulate async event
                        setTimeout(() => {
                            this.getState().setValue('bar');
                            finishRendering();
                            assert.equal(
                                dom.outerHTML,
                                '<div><div>bar</div></div>',
                            );
                            done();
                        }, 1);
                    },
                }),
            );
            const ConnectedComponent = enhance(Component);
            dom = renderWithProvide(ConnectedComponent);
        });

        it('should be able to take a function to map actions to props', done => {
            const enhance = connect(
                state => {
                    return { value: state.value };
                },
                (dispatch, props) => {
                    return {
                        setValue: val => {
                            dispatch({
                                type: 'SET',
                                payload: `${val}_${props.suffix}`,
                            });
                        },
                    };
                },
            );
            let dom;
            const Component = createComponent(
                template,
                null,
                ({ componentDidMount }) => ({
                    componentDidMount() {
                        componentDidMount.call(this);
                        //simulate async event
                        setTimeout(() => {
                            this.getState().setValue('bar');
                            finishRendering();
                            assert.equal(
                                dom.outerHTML,
                                '<div><div>bar_melody</div></div>',
                            );
                            done();
                        }, 1);
                    },
                }),
            );
            const ConnectedComponent = enhance(Component);
            dom = renderWithProvide(ConnectedComponent, { suffix: 'melody' });
        });

        it('should be able to call action from componentDidMount', done => {
            const enhance = connect(
                state => {
                    return { value: state.value };
                },
                {
                    setValue: val => {
                        return { type: 'SET', payload: val };
                    },
                },
            );
            const Component = createComponent(
                template,
                undefined,
                ({ componentDidMount }) => ({
                    componentDidMount() {
                        componentDidMount.call(this);
                        assert.equal(this.el.outerHTML, '<div>foo</div>');
                        this.getState().setValue('bar');
                        finishRendering();
                        assert.equal(this.el.outerHTML, '<div>bar</div>');
                        done();
                    },
                }),
            );
            const ConnectedComponent = enhance(Component);
            renderWithProvide(ConnectedComponent);
        });
    });

    describe('with internal state', () => {
        let Component, instance;
        const template = {
            render(_context) {
                elementOpen('div', 'inner');
                text(`${_context.value} `);
                text(_context.internalValue);
                elementClose('div');
            },
        };

        function internalReducer(state = { internalValue: 'foo' }, action) {
            switch (action.type) {
                case RECEIVE_PROPS:
                    return {
                        ...state,
                        ...action.payload,
                    };
                case 'SET_INTERNAL':
                    return {
                        ...state,
                        internalValue: action.payload,
                    };
                default:
                    return state;
            }
        }

        const instanceMixin = ({ componentWillMount }) => ({
            componentWillMount() {
                componentWillMount.call(this);
                instance = this;
            },
        });

        beforeEach(() => {
            Component = createComponent(
                template,
                internalReducer,
                instanceMixin,
            );
        });

        it('should be able for the wrapped component to change its internal state', done => {
            const enhance = connect(state => ({ value: state.value + '!' }));
            const ConnectedComponent = enhance(Component);

            const dom = renderWithProvide(ConnectedComponent);
            assert.equal(dom.outerHTML, '<div><div>foo! foo</div></div>');
            instance.dispatch({ type: 'SET_INTERNAL', payload: 'bar' });
            finishRendering();
            assert.equal(dom.outerHTML, '<div><div>foo! bar</div></div>');
            done();
        });

        it('should render after both internal and external changes', done => {
            const enhance = connect(state => ({ value: state.value + '!' }));
            const ConnectedComponent = enhance(Component);

            const dom = renderWithProvide(ConnectedComponent);
            instance.dispatch({ type: 'SET_INTERNAL', payload: 'bar' });
            store.dispatch({ type: 'SET', payload: 'qux' });
            finishRendering();

            assert.equal(dom.outerHTML, '<div><div>qux! bar</div></div>');
            done();
        });

        it('should conditionally render connected component', done => {
            const enhance = connect(state => ({ value: state.value + '!' }));
            const ChildComponent = enhance(
                createComponent({
                    render(_context) {
                        elementOpen('div');
                        text(_context.value);
                        elementClose('div');
                    },
                }),
            );

            const template = {
                render(_context) {
                    elementOpen('div');
                    if (_context.showChild) {
                        component(ChildComponent, 'child');
                    }
                    elementClose('div');
                },
            };

            const reducer = (state = { showChild: false }, action) => {
                switch (action.type) {
                    case RECEIVE_PROPS:
                        return {
                            ...state,
                            ...action.payload,
                        };
                    case 'SHOW':
                        return {
                            ...state,
                            showChild: true,
                        };
                    default:
                        return state;
                }
            };

            const Component = createComponent(template, reducer, instanceMixin);
            const dom = renderWithProvide(Component);
            assert.equal(dom.outerHTML, '<div><div></div></div>');
            instance.dispatch({ type: 'SHOW' });
            finishRendering();
            assert.equal(
                dom.outerHTML,
                '<div><div><div>foo!</div></div></div>',
            );
            done();
        });
    });

    describe('factory functions', () => {
        it('should allow providing a factory function to mapStateToProps', () => {
            let factoryCallCount = 0;
            let updatedCount = 0;
            let memoizedReturnCount = 0;

            const createMapStateToProps = () => {
                let propPrev;
                let valuePrev;
                let resultPrev;
                factoryCallCount++;
                return (state, props) => {
                    if (props.name === propPrev && valuePrev === state.value) {
                        memoizedReturnCount++;
                        return resultPrev;
                    }
                    propPrev = props.name;
                    valuePrev = state.value;
                    return (resultPrev = {
                        someObject: { prop: props.name, value: state.value },
                    });
                };
            };

            const containerTemplate = {
                render(_context) {
                    elementOpen('span');
                    text(_context.someObject.prop);
                    text(_context.someObject.value);
                    elementClose('span');
                },
            };
            const ContainerDumb = createComponent(
                containerTemplate,
                null,
                ({ componentDidUpdate }) => {
                    return {
                        componentDidUpdate(...args) {
                            updatedCount++;
                            componentDidUpdate.call(this, ...args);
                        },
                    };
                },
            );
            const enhance = connect(createMapStateToProps);
            const Container = enhance(ContainerDumb);

            const appTemplate = {
                render(_context) {
                    elementOpen('div');
                    component(Container, 'a', { name: 'a' });
                    component(Container, 'b', { name: 'b' });
                    elementClose('div');
                },
            };
            const App = createComponent(appTemplate);
            renderWithProvide(App);
            finishRendering();
            store.dispatch({ type: 'SET', payload: 'foo' });
            finishRendering();
            assert.equal(updatedCount, 0);
            assert.equal(memoizedReturnCount, 2);
            assert.equal(factoryCallCount, 2);
        });

        it('should allow providing a factory function to mapDispatchToProps', () => {
            let updatedCount = 0;
            let memoizedReturnCount = 0;
            let factoryCallCount = 0;

            const mapStateToProps = (state, props) => ({
                value: state.value,
            });

            const createMapDispatchToProps = () => {
                let propPrev;
                let resultPrev;
                factoryCallCount++;
                return (dispatch, props) => {
                    if (props.name === propPrev) {
                        memoizedReturnCount++;
                        return resultPrev;
                    }
                    propPrev = props.name;
                    return (resultPrev = {
                        someObject: { dispatchFn: dispatch },
                    });
                };
            };
            function mergeParentDispatch(
                stateProps,
                dispatchProps,
                parentProps,
            ) {
                return {
                    ...stateProps,
                    ...dispatchProps,
                    name: parentProps.name,
                };
            }

            const containerTemplate = {
                render(_context) {
                    elementOpen('span');
                    text(_context.value);
                    text(_context.name);
                    elementClose('span');
                },
            };
            const ContainerDumb = createComponent(
                containerTemplate,
                null,
                ({ componentDidUpdate }) => ({
                    componentDidUpdate(...args) {
                        updatedCount++;
                        componentDidUpdate.call(this, ...args);
                    },
                }),
            );
            const enhance = connect(
                mapStateToProps,
                createMapDispatchToProps,
                mergeParentDispatch,
            );
            const Container = enhance(ContainerDumb);

            const appTemplate = {
                render(_context) {
                    elementOpen('div');
                    component(Container, 'a', { name: 'a', odd: _context.odd });
                    component(Container, 'b', { name: 'b', odd: _context.odd });
                    elementClose('div');
                },
            };
            function appReducer(state = { odd: false }, action) {
                switch (action.type) {
                    case 'TOGGLE':
                        return { odd: !state.odd };
                    default:
                        return state;
                }
            }
            const App = createComponent(
                appTemplate,
                appReducer,
                ({ componentDidMount }) => ({
                    componentDidMount() {
                        componentDidMount.call(this);
                        this.dispatch({ type: 'TOGGLE' });
                    },
                }),
            );
            renderWithProvide(App);
            finishRendering();
            store.dispatch({ type: 'SET', payload: 'bar' });
            finishRendering();
            assert.equal(updatedCount, 2);
            assert.equal(memoizedReturnCount, 2);
            assert.equal(factoryCallCount, 2);
        });
    });

    it('should render nested connected components', done => {
        const enhance = connect(state => ({ value: state.value }));
        const childTemplate = {
            render(_context) {
                elementOpen('div');
                text(_context.value);
                elementClose('div');
            },
        };
        const ChildComponent = enhance(createComponent(childTemplate));

        const template = {
            render(_context) {
                elementOpen('div');
                component(ChildComponent, 'child');
                elementClose('div');
            },
        };
        const Component = enhance(createComponent(template));

        const dom = renderWithProvide(Component);

        assert.equal(dom.outerHTML, '<div><div><div>foo</div></div></div>');
        done();
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
