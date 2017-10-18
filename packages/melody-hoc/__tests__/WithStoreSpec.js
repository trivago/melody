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
    elementOpen,
    elementClose,
    text,
    flush as _flush,
    component,
} from 'melody-idom';
import withStore, { RECEIVE_PROPS } from '../src/withStore';
import { createStore } from 'redux';

const template = {
    render({ name, state, dispatch }) {
        elementOpen('button', null, [
            'onclick',
            () => dispatch({ type: 'INC' }),
        ]);
        text(name);
        text(' ');
        text(state);
        elementClose('button');
    },
};

const flush = () => {
    _flush({
        didTimeout: true,
        timeRemaining() {
            return 0;
        },
    });
};

describe('WithStore', () => {
    let store;
    let lastProps;
    let StatelessComp;
    let StatefulComp;
    let root;

    beforeEach(() => {
        store = createStore((state = 0, { type, payload }) => {
            switch (type) {
                case RECEIVE_PROPS:
                    lastProps = payload;
                    return state;
                case 'INC':
                    return state + 1;
            }
        });

        lastProps = undefined;
        StatelessComp = createComponent(template);
        StatefulComp = withStore(() => store)(StatelessComp);
        root = document.createElement('button');
    });

    it('should map state to props', () => {
        render(root, StatefulComp, { name: 'foo' });

        expect(root.outerHTML).toEqual('<button>foo 0</button>');
    });

    it('should rerender when store updates', () => {
        render(root, StatefulComp, { name: 'foo' });

        expect(root.outerHTML).toEqual('<button>foo 0</button>');

        store.dispatch({ type: 'INC' });
        flush();

        expect(root.outerHTML).toEqual('<button>foo 1</button>');

        store.dispatch({ type: 'INC' });
        flush();

        expect(root.outerHTML).toEqual('<button>foo 2</button>');

        render(root, StatefulComp, { name: 'bar' });
        expect(root.outerHTML).toEqual('<button>bar 2</button>');
    });

    it('should map dispatch to props', () => {
        render(root, StatefulComp, { name: 'foo' });

        expect(root.outerHTML).toEqual('<button>foo 0</button>');

        root.click();
        flush();

        expect(root.outerHTML).toEqual('<button>foo 1</button>');

        root.click();
        flush();

        expect(root.outerHTML).toEqual('<button>foo 2</button>');
    });

    it('should unsubscribe from store on unmount', () => {
        let unsubCount = 0;
        const replaceSubscribe = () => {
            const oldSub = store.subscribe;
            store.subscribe = listener => {
                const unsub = oldSub(listener);
                return () => {
                    unsubCount++;
                    unsub();
                };
            };
        };

        replaceSubscribe();

        const Wrapper = createComponent({
            render(props) {
                elementOpen('div');
                if (!props.hide) {
                    component(StatefulComp, 'comp', { name: 'foo' });
                }
                elementClose('div');
            },
        });

        const wrapperRoot = document.createElement('div');

        render(wrapperRoot, Wrapper, { hide: false });
        expect(unsubCount).toBe(0);
        render(wrapperRoot, Wrapper, { hide: true });
        expect(unsubCount).toBe(1);
    });

    it('should subscribe to store after unmounting/mounting', () => {
        let subCount = 0;
        const replaceSubscribe = () => {
            const oldSub = store.subscribe;
            store.subscribe = listener => {
                subCount++;
                return oldSub(listener);
            };
        };

        replaceSubscribe();

        const Wrapper = createComponent({
            render(props) {
                elementOpen('div');
                if (!props.hide) {
                    component(StatefulComp, 'comp', { name: 'foo' });
                }
                elementClose('div');
            },
        });

        const wrapperRoot = document.createElement('div');

        render(wrapperRoot, Wrapper, { hide: false });
        expect(subCount).toBe(1);
        render(wrapperRoot, Wrapper, { hide: true });
        expect(subCount).toBe(1);
        render(wrapperRoot, Wrapper, { hide: false });
        expect(subCount).toBe(2);
    });

    it('should receive props', () => {
        expect(lastProps).toBe(undefined);

        render(root, StatefulComp, { name: 'foo' });
        expect(lastProps).toEqual({ name: 'foo' });

        render(root, StatefulComp, { name: 'bar' });
        expect(lastProps).toEqual({ name: 'bar' });

        store.dispatch({ type: 'INC' });
        flush();
        expect(lastProps).toEqual({ name: 'bar' });
    });
});
