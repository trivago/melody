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
            expect(called).toEqual(1);
            rerender(unique());
            flush();
            expect(called).toEqual(2);
            rerender(unique());
            flush();
            expect(called).toEqual(3);
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
            expect(called).toEqual(1);
            rerender(unique());
            flush();
            expect(called).toEqual(1);
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
            expect(root.outerHTML).toEqual('<div>0</div>');
            expect(called).toEqual(1);
            rerender(unique());
            flush();
            expect(called).toEqual(1);
            setValue(1);
            flush();
            expect(root.outerHTML).toEqual('<div>1</div>');
            expect(called).toEqual(2);
            rerender(unique());
            flush();
            expect(root.outerHTML).toEqual('<div>1</div>');
            expect(called).toEqual(2);
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
            expect(called).toEqual(1);
            setValue(['a']);
            flush();
            expect(called).toEqual(2);
            setValue(['a', 'b']);
            // the second call to setValue should not reset the hook's internal `dirty` property,
            // value.length will be 2 for both times `setValue` is called.
            // here we test that once dirty is true, it will not be resetted
            setValue(['a', 'c']);
            flush();
            expect(called).toEqual(3);
        });
        it('should ignore unsubscribe if it is not a function', () => {
            const root = document.createElement('div');
            const MyComponent = createComponent(() => {
                useEffect(() => 'not a function');
            }, template);

            /* eslint-disable no-console */
            const temp = console.warn;
            console.warn = jest.fn();
            render(root, MyComponent);

            expect(console.warn).toHaveBeenCalledWith(
                'useEffect: expected the unsubscribe callback to be a function or undefined. Instead received string.'
            );
            console.warn = temp;
            /* eslint-enable no-console */
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
            expect(called).toEqual(1);
            expect(calledUnsubscribe).toEqual(0);
            rerender(unique());
            flush();
            expect(called).toEqual(2);
            expect(calledUnsubscribe).toEqual(1);
            rerender(unique());
            flush();
            expect(called).toEqual(3);
            expect(calledUnsubscribe).toEqual(2);
            unmountComponentAtNode(root);
            expect(calledUnsubscribe).toEqual(3);
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
            expect(called).toEqual(1);
            expect(calledUnsubscribe).toEqual(0);
            rerender(unique());
            flush();
            expect(called).toEqual(1);
            expect(calledUnsubscribe).toEqual(0);
            unmountComponentAtNode(root);
            expect(calledUnsubscribe).toEqual(1);
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
            expect(root.outerHTML).toEqual('<div>0</div>');
            expect(called).toEqual(1);
            expect(calledUnsubscribe).toEqual(0);
            rerender(unique());
            flush();
            expect(called).toEqual(1);
            expect(calledUnsubscribe).toEqual(0);
            setValue(1);
            flush();
            expect(root.outerHTML).toEqual('<div>1</div>');
            expect(called).toEqual(2);
            expect(calledUnsubscribe).toEqual(1);
            rerender(unique());
            flush();
            expect(root.outerHTML).toEqual('<div>1</div>');
            expect(called).toEqual(2);
            unmountComponentAtNode(root);
            expect(calledUnsubscribe).toEqual(2);
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
            expect(called).toEqual(1);
            rerender(unique());
            flush();
            expect(called).toEqual(1);
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
            expect(called).toEqual(1);
            expect(calledUnsubscribe).toEqual(0);
            rerender(unique());
            flush();
            expect(called).toEqual(1);
            expect(calledUnsubscribe).toEqual(0);
            unmountComponentAtNode(root);
            expect(calledUnsubscribe).toEqual(1);
        });
    });
});
