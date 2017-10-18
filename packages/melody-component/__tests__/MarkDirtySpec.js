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

import { createComponent, render, RECEIVE_PROPS } from '../src';
import { elementOpen, elementClose, component, text } from 'melody-idom';

const instanceAccessor = setter => {
    return ({ componentWillMount }) => ({
        componentWillMount() {
            componentWillMount.call(this);
            setter(this);
        },
    });
};

it('should not try to render an already unmounted child', done => {
    const childTemplate = {
        render() {
            elementOpen('div');
            text('foo');
            elementClose('div');
        },
    };

    let childInstance;
    // always return new state to force rerender
    const ChildComponent = createComponent(
        childTemplate,
        state => ({}),
        instanceAccessor(i => (childInstance = i)),
    );

    const parentReducer = (state = { show: true }, action) => {
        if (action.type === RECEIVE_PROPS) {
            return {
                ...state,
                ...action.payload,
            };
        }
        if (action.type === 'HIDE') {
            return {
                ...state,
                show: false,
            };
        }
        return state;
    };

    const parentTemplate = {
        render(_context) {
            elementOpen('div');
            if (_context.show) {
                component(ChildComponent, 'child');
            }
            elementClose('div');
        },
    };

    let parentInstance;
    const ParentComponent = createComponent(
        parentTemplate,
        parentReducer,
        instanceAccessor(i => (parentInstance = i)),
    );

    const root = document.createElement('div');
    render(root, ParentComponent);

    // dispatch on parent instance first, which will delete child nodes
    // then dispatch something to child to trigger rerender
    parentInstance.dispatch({ type: 'HIDE' });
    childInstance.dispatch({});
    done();
});
