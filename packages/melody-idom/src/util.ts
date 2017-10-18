/**
 * Copyright 2015 The Incremental DOM Authors.
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
import { drop, mountedComponents } from './renderQueue';
import { getChildren, unlink } from './hierarchy';
import options from './options';

/**
 * A cached reference to the create function.
 */
function Blank() {}
Blank.prototype = Object.create(null);

/**
 * Creates an map object without a prototype.
 * @return {!Object}
 */
var createMap = function(): any {
    return new Blank();
};

var unmountComponent = function(comp) {
    getChildren(comp).forEach(unmountComponent);
    unlink(comp);
    drop(comp);
    const data = comp.el ? comp.el['__incrementalDOMData'] : null;
    if (options.beforeUnmount) {
        options.beforeUnmount(comp);
    }
    if (mountedComponents.has(comp)) {
        comp.componentWillUnmount();
        mountedComponents.delete(comp);
    }
    if (data && data.componentInstance) {
        data.componentInstance = null;
    }
    comp.el = null;
};

var documentRange = null;

function parseHTML(htmlString: string): NodeList {
    if (!documentRange) {
        documentRange = document.createRange();
        documentRange.selectNode(document.body);
    }
    return documentRange.createContextualFragment(htmlString.trim()).childNodes;
}

/** */
export { createMap, parseHTML, unmountComponent };
