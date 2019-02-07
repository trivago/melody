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
import {
    createComponent,
    useState,
    useMutationEffect,
    useRef,
    useEffect,
} from '../src';
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

describe('useMutationEffect', () => {
    describe('timing', () => {
        it('should be called before useEffect', () => {
            const root = document.createElement('div');
            const log = [];
            const MyComponent = createComponent(() => {
                useEffect(() => {
                    log.push('effect');
                });
                useMutationEffect(() => {
                    log.push('mutation');
                });
            }, template);
            render(root, MyComponent);
            assert.deepEqual(log, ['mutation', 'effect']);
        });
    });
    describe('setState', () => {
        it('should throw when using setState in callback', () => {
            const root = document.createElement('div');
            const MyComponent = createComponent(() => {
                const [, setValue] = useState(0);
                useMutationEffect(() => {
                    setValue(1);
                });
            }, template);
            assert.throws(() => {
                render(root, MyComponent);
            }, 'Melody does not allow using `setState` in `useMutationEffect` since this would harm rendering performance. This hook is meant for manually mutating the DOM');
        });
    });
    describe('refs', () => {
        it('refs should be available in the callback', () => {
            const root = document.createElement('div');
            let ref;
            const template = {
                render(_context) {
                    elementOpen('div', null, null, 'ref', _context.myref);
                    text(_context.value);
                    elementClose('div');
                },
            };
            const MyComponent = createComponent(() => {
                const myref = useRef(null);
                useMutationEffect(() => {
                    ref = myref.current;
                });
                return { myref };
            }, template);
            render(root, MyComponent);
            assert.instanceOf(ref, HTMLDivElement);
        });
    });
    describe('without unsubscribe', () => {
        it('should call mutation effect on mount and every update', () => {
            const root = document.createElement('div');
            let called = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useMutationEffect(() => {
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
        it('should call mutation effect on mount', () => {
            const root = document.createElement('div');
            let called = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useMutationEffect(() => {
                    called++;
                }, []);
            }, template);
            render(root, MyComponent);
            assert.equal(called, 1);
            rerender(unique());
            flush();
            assert.equal(called, 1);
        });
        it('should call mutation effect on mount and when a value changes', () => {
            const root = document.createElement('div');
            let called = 0;
            let rerender;
            let setValue;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                const state = useState(0);
                const value = state[0];
                setValue = state[1];
                useMutationEffect(
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
    });
    describe('with unsubscribe', () => {
        it('should call mutation effect on mount and every update and unsubscribe after every update and on unmount', () => {
            const root = document.createElement('div');
            let called = 0;
            let calledUnsubscribe = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useMutationEffect(() => {
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
        it('should call mutation effect on mount and unsubscribe on unmount', () => {
            const root = document.createElement('div');
            let called = 0;
            let calledUnsubscribe = 0;
            let rerender;
            const MyComponent = createComponent(() => {
                rerender = useState()[1];
                useMutationEffect(() => {
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
        it('should call mutation effect on mount and when a value changes', () => {
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
                useMutationEffect(
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
