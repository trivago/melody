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

import { getData } from './node_data';

const getNamespace = function(name) {
    if (name.lastIndexOf('xml:', 0) === 0) {
        return 'http://www.w3.org/XML/1998/namespace';
    }

    if (name.lastIndexOf('xlink:', 0) === 0) {
        return 'http://www.w3.org/1999/xlink';
    }
};

/**
 * Applies an attribute or property to a given Element. If the value is null
 * or undefined, it is removed from the Element. Otherwise, the value is set
 * as an attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {?(boolean|number|string)=} value The attribute's value.
 */
const applyAttr = function(el, name, value) {
    if (value == null) {
        el.removeAttribute(name);
    } else {
        const attrNS = getNamespace(name);
        if (attrNS) {
            el.setAttributeNS(attrNS, name, value);
        } else {
            el.setAttribute(name, value);
        }
    }
};

/**
 * Updates a single attribute on an Element.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value. If the value is an object or
 *     function it is set on the Element, otherwise, it is set as an HTML
 *     attribute.
 */
function applyAttributeTyped(el, name, value) {
    var type = typeof value;

    if (type === 'object' || type === 'function') {
        setProperty(el, name, value);
    } else {
        applyAttr(el, name /** @type {?(boolean|number|string)} */, value);
    }
}

function setProperty(el, name, value) {
    try {
        el[name] = value;
    } catch (e) {}
}

function eventProxy(e) {
    return this._listeners[e.type](e);
}

/**
 * Calls the appropriate attribute mutator for this attribute.
 * @param {!Element} el
 * @param {string} name The attribute's name.
 * @param {*} value The attribute's value.
 */
const updateAttribute = function(el, name, value) {
    var data = getData(el);
    var attrs = data.attrs;

    if (attrs[name] === value) {
        return;
    }

    if (name === 'style') {
        const old = attrs.style;
        if (!value || typeof value === 'string') {
            el.style.cssText = value || '';
        } else {
            if (typeof old === 'string') {
                el.style.cssText = '';
            } else {
                for (let i in old) {
                    if (!(i in value)) {
                        el.style[i] = '';
                    }
                }
            }
            for (let i in value) {
                if (i.indexOf('-') >= 0) {
                    el.style.setProperty(i, value[i]);
                } else {
                    el.style[i] = value[i];
                }
            }
        }
    } else if (name === 'ref') {
        const old = attrs.ref;
        if (old && old.disposer) {
            if (old.creator === value) {
                return;
            }
            old.disposer.unsubscribe();
        }
        if (!value) {
            attrs.ref = null;
            return;
        }
        attrs.ref = {
            creator: value,
            disposer: value(el),
        };
        if (process.env.NODE_ENV !== 'production') {
            if (
                !attrs.ref.disposer ||
                typeof attrs.ref.disposer.unsubscribe !== 'function'
            ) {
                throw new Error(
                    `A ref handler is supposed to return a Subscription object which must have a "unsubscribe" method.`
                );
            }
        }
        return;
    } else if (name[0] === 'o' && name[1] === 'n') {
        if (typeof value === 'string') {
            applyAttributeTyped(el, name, value);
        } else {
            let eventName = name.replace(/Capture$/, '');
            let useCapture = name !== eventName;
            eventName = eventName.toLowerCase().substring(2);
            if (value) {
                if (!attrs[name]) {
                    el.addEventListener(eventName, eventProxy, useCapture);
                }
            } else if (typeof attrs[name] === 'string') {
                el.removeAttribute(name);
            } else {
                el.removeEventListener(eventName, eventProxy, useCapture);
            }
            (el._listeners || (el._listeners = {}))[eventName] = value;
        }
    } else if (
        name !== 'list' &&
        name !== 'type' &&
        name !== 'draggable' &&
        !(el.ownerSVGElement || el.localName === 'svg') &&
        name in el
    ) {
        setProperty(el, name, value == null ? '' : value);
        if (value == null || value === false) {
            el.removeAttribute(name);
        }
    } else {
        applyAttributeTyped(el, name, value);
    }

    attrs[name] = value;
};

/** */
export { updateAttribute };
