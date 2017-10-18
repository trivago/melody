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
import { createComponent, render, RECEIVE_PROPS } from '../src';
import { elementOpen, elementClose, component, text, flush } from 'melody-idom';

let root, parent, children, Parent, Child;

const childTemplate = {
    render(state) {
        elementOpen('span');
        text(`${state.paddedIndex} and ${state.childCount}`);
        elementClose('span');
    },
};

const parentTemplate = {
    render(count) {
        elementOpen('div', 'parent');
        elementOpen('span');
        text('Some element without key');
        elementClose('span');
        for (let i = 0; i < 5; i++) {
            component(Child, `${i}`, {
                paddedIndex: `${i + count}`,
            });
        }
        elementClose('div');
    },
};

function createDOM() {
    parent = document.createElement('div');
    parent.setAttribute('key', 'parent');
    children = [];

    const someChild = document.createElement('span');
    someChild.textContent = 'Some element without key';
    parent.appendChild(someChild);

    for (let i = 0; i < 5; i++) {
        const child = document.createElement('span');
        child.setAttribute('key', `${i}`);
        child.textContent = `${i}`;
        parent.appendChild(child);
        children.push(child);
    }
}

beforeEach(() => {
    Child = createComponent(
        childTemplate,
        (state = { childCount: 0 }, { type, payload }) => {
            if (type === 'INC') {
                return {
                    ...state,
                    childCount: state.childCount + 1,
                };
            }
            if (type === RECEIVE_PROPS) {
                return { ...state, ...payload };
            }
            return state;
        },
    );
    Parent = createComponent(parentTemplate, (count = 0, { type }) => {
        if (type === 'INC') {
            return count + 1;
        }
        return count;
    });
    root = document.createElement('div');
    createDOM();
    root.appendChild(parent);
    render(parent, Parent);
});

test('should mount on top of existing keyed components', () => {
    expect(root.innerHTML).toMatchSnapshot();
});

test('parent should rerender', done => {
    parent.__incrementalDOMData.componentInstance.dispatch({ type: 'INC' });
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
    expect(root.innerHTML).toMatchSnapshot();
    done();
});

test('children should rerender', done => {
    for (let i = 0; i < 5; i++) {
        children[i].__incrementalDOMData.componentInstance.dispatch({
            type: 'INC',
        });
    }
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
    expect(root.innerHTML).toMatchSnapshot();
    done();
});

test('parent should rerender after children rerender', done => {
    for (let i = 0; i < 5; i++) {
        children[i].__incrementalDOMData.componentInstance.dispatch({
            type: 'INC',
        });
    }
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
    parent.__incrementalDOMData.componentInstance.dispatch({ type: 'INC' });
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
    expect(root.innerHTML).toMatchSnapshot();
    done();
});

test('children should rerender after parent rerender', done => {
    parent.__incrementalDOMData.componentInstance.dispatch({ type: 'INC' });
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
    for (let i = 0; i < 5; i++) {
        children[i].__incrementalDOMData.componentInstance.dispatch({
            type: 'INC',
        });
    }
    flush({
        didTimeout: false,
        timeRemaining() {
            return 10;
        },
    });
    expect(root.innerHTML).toMatchSnapshot();
    done();
});
