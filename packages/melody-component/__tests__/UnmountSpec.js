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
import { createComponent, render, unmountComponentAtNode } from '../src';
import { component, elementOpen, elementClose, text } from 'melody-idom';

describe('Unmount', function() {
    describe('unmountComponentAtNode', function() {
        it('should trigger componentWillUnmount when components are removed', function() {
            const innerTemplate = {
                render(_context) {
                    elementOpen('div', null, null);
                    text('inner');
                    elementClose('div');
                },
            };
            let innerUnmounted = 0;
            const InnerComponent = createComponent(innerTemplate, undefined, {
                componentWillUnmount() {
                    innerUnmounted++;
                },
            });
            const template = {
                render(_context) {
                    elementOpen('div', null, null);
                    component(InnerComponent, {});
                    elementClose('div');
                },
            };
            let unmounted = 0;
            const MyComponent = createComponent(template, undefined, {
                componentWillUnmount() {
                    unmounted++;
                },
            });

            const root = document.createElement('div');
            render(root, MyComponent);
            assert.equal(unmounted, 0);
            assert.equal(innerUnmounted, 0);

            unmountComponentAtNode(root);
            assert.equal(unmounted, 1);
            assert.equal(innerUnmounted, 1);
        });

        it('should remove node data', function() {
            const template = {
                render(_context) {
                    elementOpen('div', null, null);
                    text('yay');
                    elementClose('div');
                },
            };
            const MyComponent = createComponent(template);

            const root = document.createElement('div');
            render(root, MyComponent);
            assert(!!root['__incrementalDOMData']);

            unmountComponentAtNode(root);
            assert(!root['__incrementalDOMData']);
        });
    });
});
