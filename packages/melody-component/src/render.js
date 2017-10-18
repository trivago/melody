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
import { mount, patchOuter, flush, unmountComponent } from 'melody-idom';

export function render(el, Component, props) {
    const result = patchOuter(el, () => {
        mount(el, Component, props);
    });
    if (process.env.NODE_ENV === 'test') {
        flush({
            didTimeout: false,
            timeRemaining() {
                return 10;
            },
        });
    }
    return result;
}

export function unmountComponentAtNode(node) {
    if (!node) {
        return;
    }
    const data = node['__incrementalDOMData'];
    // No data? No component.
    if (!data) {
        return;
    }
    // No componentInstance? Unmounting not needed.
    const { componentInstance } = data;
    if (!componentInstance) {
        return;
    }
    // Tear down components
    unmountComponent(componentInstance);
    // Remove node data
    node['__incrementalDOMData'] = undefined;
}
