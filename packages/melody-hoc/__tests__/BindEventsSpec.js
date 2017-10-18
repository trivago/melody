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
import { expect } from 'chai';

import { createComponent, render } from 'melody-component';
import {
    patchOuter,
    elementOpen,
    elementClose,
    component,
    ref,
    flush,
} from 'melody-idom';
import { bindEvents, lifecycle, compose } from '../src';

const template = {
    render(_context) {
        elementOpen('div', null, ['ref', _context.div]);
        elementClose('div');
    },
};

function dispatchClick(el) {
    const event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    el.dispatchEvent(event);
}

describe('BindEvents', function() {
    it('should bind event handlers when mounted', function() {
        const root = document.createElement('div');
        let clicked = false;
        let context;
        const enhance = bindEvents({
            div: {
                click(event, component) {
                    clicked = true;
                    context = component;
                },
            },
        });

        const MyComponent = createComponent(template);
        const EnhancedComponent = enhance(MyComponent);

        render(root, EnhancedComponent, {});
        dispatchClick(root);
        expect(clicked).to.equal(true);
        expect(context).to.be.a('object');
        expect(context.props).to.be.a('object');
    });
    it('should unbind event handlers when unmounted', function() {
        const root = document.createElement('div');
        let clickedCount = 0;

        const enhance = compose(
            bindEvents({
                div: {
                    click() {
                        clickedCount++;
                    },
                },
            }),
        );

        const MyComponent = createComponent(template);
        const EnhancedComponent = enhance(MyComponent);

        const renderTemplate = _context => {
            elementOpen('div');
            if (_context.comp) {
                component(EnhancedComponent, 'test');
            }
            elementClose('div');
        };

        patchOuter(root, renderTemplate, { comp: true });
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
        const croot = root.childNodes[0];
        dispatchClick(croot);
        patchOuter(root, renderTemplate, { comp: false });
        dispatchClick(croot);
        expect(clickedCount).to.equal(1);
    });
});
