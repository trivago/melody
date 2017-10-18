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

import { getData, initData } from './node_data';
import { parseHTML } from './util';

/**
 * Gets the namespace to create an element (of a given tag) in.
 * @param {string} tag The tag to get the namespace for.
 * @param {?Node} parent
 * @return {?string} The namespace to create the tag in.
 */
var getNamespaceForTag = function(tag, parent) {
    if (tag === 'svg') {
        return 'http://www.w3.org/2000/svg';
    }

    if (getData(parent).nodeName === 'foreignObject') {
        return null;
    }

    return parent.namespaceURI;
};

/**
 * Creates an Element.
 * @param {Document} doc The document with which to create the Element.
 * @param {?Node} parent
 * @param {string} tag The tag for the Element.
 * @param {?string=} key A key to identify the Element.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element.
 * @return {!Element}
 */
var createElement = function(doc, parent, tag, key) {
    var namespace = getNamespaceForTag(tag, parent);
    var el;

    if (namespace) {
        el = doc.createElementNS(namespace, tag);
    } else {
        el = doc.createElement(tag);
    }

    initData(el, tag, key);

    return el;
};

/**
 * Creates a Text Node.
 * @param {Document} doc The document with which to create the Element.
 * @return {!Text}
 */
var createText = function(doc) {
    var node = doc.createTextNode('');
    initData(node, '#text', null);
    return node;
};

var createRaw = function(doc, html) {
    var children = parseHTML(html);
    if (!children.length) {
        const frag = document.createElement('div');
        frag.appendChild(doc.createTextNode(''));
        children = frag.childNodes;
    }
    var data = initData(children[0], '#raw', null);
    data.text = html;
    data.childLength = children.length;
    return children;
};

/** */
export { createElement, createText, createRaw };
