/**
 * Copyright 2019 trivago N.V.
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

import { elementVoid, flush } from 'melody-idom';
import { render, unmountComponentAtNode } from 'melody-component';
import { createComponent } from '../../src';

const defaultTemplate = {
    render(_context) {
        elementVoid('div');
    },
};

export const createTestComponent = (
    componentFn,
    template = defaultTemplate
) => {
    let callCount = 0;
    let renderCount = 0;

    const finalTemplate = {
        ...template,
        render(_context) {
            renderCount++;
            return template.render(_context);
        },
    };

    const Component = createComponent(props => {
        callCount++;
        return componentFn(props);
    }, finalTemplate);

    const root = document.createElement('div');

    return {
        getData: () => root.__incrementalDOMData.componentInstance.data,
        getNode: () => root,
        getHtml: () => root.outerHTML,
        getCallCount: () => callCount,
        getRenderCount: () => renderCount,
        render: props => render(root, Component, props),
        flush: () =>
            flush({
                didTimeout: false,
                timeRemaining() {
                    return 10;
                },
            }),
        unmount: () => unmountComponentAtNode(root),
    };
};
