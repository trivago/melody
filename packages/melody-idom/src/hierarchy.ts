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
const parentToChildren = new WeakMap();
const childToParent = new WeakMap();

export function link(parent, child) {
    childToParent.set(child, parent);
    const children = getChildren(parent);
    children.push(child);
}

export function unlink(node) {
    parentToChildren.delete(node);
    childToParent.delete(node);
}

export function getChildren(parent) {
    let children = parentToChildren.get(parent);
    if (!children) {
        children = [];
        parentToChildren.set(parent, children);
    }
    return children;
}

export function getParent(child) {
    return childToParent.get(child);
}

export function reset(node) {
    parentToChildren.set(node, []);
}
