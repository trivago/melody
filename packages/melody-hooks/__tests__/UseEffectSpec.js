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
import { assert } from 'chai';

import { render, unmountComponentAtNode } from 'melody-component';
import { elementOpen, elementClose, text } from 'melody-idom';
import { createComponent, useState, useEffect, useEffectOnce } from '../src';
import { flush } from './util/flush';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

let uniqueId = 0;
const unique = () => uniqueId++;

describe('useEffect', () => {
    describe('without unsubscribe', () => {
        it('should call effect on mount and every update', () => {
            const root = document.createElement('div');
            let called = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useEffect(() => {
                    called++;
                });
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            rerender(unique());
            flush();
            assert.equal(called, 2);
            rerender(unique());
            flush();
            assert.equal(called, 3);
        });
        it('should call effect on mount', () => {
            const root = document.createElement('div');
            let called = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useEffect(() => {
                    called++;
                }, []);
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            rerender(unique());
            flush();
            assert.equal(called, 1);
        });
        it('should call effect on mount and when a value changes', () => {
            const root = document.createElement('div');
            let called = 0;
            let rerender;
            let setValue;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                const state = useState(0);
                const value = state[0];
                setValue = state[1];
                useEffect(
                    () => {
                        called++;
                    },
                    [value]
                );
                return {
                    value,
                };
            }, template);
            render(root, MyComponent);
            assert.equal(root.outerHTML, '<div>0</div>');
            assert.equal(called, 1);
            rerender(unique());
            flush();
            assert.equal(called, 1);
            setValue(1);
            flush();
            assert.equal(root.outerHTML, '<div>1</div>');
            assert.equal(called, 2);
            rerender(unique());
            flush();
            assert.equal(root.outerHTML, '<div>1</div>');
            assert.equal(called, 2);
        });
        it('should not reset `dirty` when multiple updates come in', () => {
            const root = document.createElement('div');
            let called = 0;
            let setValue;
            const MyComponent = createComponent(() => {
                const state = useState([]);
                const value = state[0];
                setValue = state[1];
                useEffect(
                    () => {
                        called++;
                    },
                    // note: we are using derived data (value.length) here
                    [value.length]
                );
                return {
                    value,
                };
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            setValue(['a']);
            flush();
            assert.equal(called, 2);
            setValue(['a', 'b']);
            // the second call to setValue should not reset the hook's internal `dirty` property,
            // value.length will be 2 for both times `setValue` is called.
            // here we test that once dirty is true, it will not be resetted
            setValue(['a', 'c']);
            flush();
            assert.equal(called, 3);
        });
        it('should ignore unsubscribe if it is not a function', () => {
            const root = document.createElement('div');
            const MyComponent = createComponent(() => {
                useEffect(() => 'not a function');
            }, template);
            render(root, MyComponent);
            unmountComponentAtNode(root);
        });
    });
    describe('with unsubscribe', () => {
        it('should call effect on mount and every update and unsubscribe after every update and on unmount', () => {
            const root = document.createElement('div');
            let called = 0;
            let calledUnsubscribe = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useEffect(() => {
                    called++;
                    return () => {
                        calledUnsubscribe++;
                    };
                });
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            assert.equal(calledUnsubscribe, 0);
            rerender(unique());
            flush();
            assert.equal(called, 2);
            assert.equal(calledUnsubscribe, 1);
            rerender(unique());
            flush();
            assert.equal(called, 3);
            assert.equal(calledUnsubscribe, 2);
            unmountComponentAtNode(root);
            assert.equal(calledUnsubscribe, 3);
        });
        it('should call effect on mount and unsubscribe on unmount', () => {
            const root = document.createElement('div');
            let called = 0;
            let calledUnsubscribe = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useEffect(() => {
                    called++;
                    return () => {
                        calledUnsubscribe++;
                    };
                }, []);
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            assert.equal(calledUnsubscribe, 0);
            rerender(unique());
            flush();
            assert.equal(called, 1);
            assert.equal(calledUnsubscribe, 0);
            unmountComponentAtNode(root);
            assert.equal(calledUnsubscribe, 1);
        });
        it('should call effect on mount and when a value changes', () => {
            const root = document.createElement('div');
            let called = 0;
            let calledUnsubscribe = 0;
            let rerender;
            let setValue;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                const state = useState(0);
                const value = state[0];
                setValue = state[1];
                useEffect(
                    () => {
                        called++;
                        return () => {
                            calledUnsubscribe++;
                        };
                    },
                    [value]
                );
                return {
                    value,
                };
            }, template);
            render(root, MyComponent);
            assert.equal(root.outerHTML, '<div>0</div>');
            assert.equal(called, 1);
            assert.equal(calledUnsubscribe, 0);
            rerender(unique());
            flush();
            assert.equal(called, 1);
            assert.equal(calledUnsubscribe, 0);
            setValue(1);
            flush();
            assert.equal(root.outerHTML, '<div>1</div>');
            assert.equal(called, 2);
            assert.equal(calledUnsubscribe, 1);
            rerender(unique());
            flush();
            assert.equal(root.outerHTML, '<div>1</div>');
            assert.equal(called, 2);
            unmountComponentAtNode(root);
            assert.equal(calledUnsubscribe, 2);
        });
    });
});
describe('useEffectOnce', () => {
    describe('without unsubscribe', () => {
        it('should call effect on mount', () => {
            const root = document.createElement('div');
            let called = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useEffectOnce(() => {
                    called++;
                });
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            rerender(unique());
            flush();
            assert.equal(called, 1);
        });
    });
    describe('with unsubscribe', () => {
        it('should call effect on mount and unsubscribe on unmount', () => {
            const root = document.createElement('div');
            let called = 0;
            let calledUnsubscribe = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useEffectOnce(() => {
                    called++;
                    return () => {
                        calledUnsubscribe++;
                    };
                });
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            assert.equal(calledUnsubscribe, 0);
            rerender(unique());
            flush();
            assert.equal(called, 1);
            assert.equal(calledUnsubscribe, 0);
            unmountComponentAtNode(root);
            assert.equal(calledUnsubscribe, 1);
        });
    });
});
