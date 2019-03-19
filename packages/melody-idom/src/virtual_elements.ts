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

import {
    elementOpen as coreElementOpen,
    elementClose as coreElementClose,
    text as coreText,
    raw as coreRaw,
    currentComponent,
    skip,
} from './core';
import { updateAttribute } from './attributes';
import { getData } from './node_data';
import {
    assertNotInAttributes,
    assertNotInSkip,
    assertInAttributes,
    assertCloseMatchesOpenTag,
    setInAttributes,
} from './assertions';

/**
 * The offset in the virtual element declaration where the attributes are
 * specified.
 * @const
 */
var ATTRIBUTES_OFFSET = 3;

/**
 * Builds an array of arguments for use with elementOpenStart, attr and
 * elementOpenEnd.
 * @const {Array<*>}
 */
var argsBuilder = [];

/**
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementOpen = function(tag, key, statics, var_args) {
    if (process.env.NODE_ENV !== 'production') {
        assertNotInAttributes('elementOpen');
        assertNotInSkip('elementOpen');
    }

    var node = coreElementOpen(tag, key);
    var data = getData(node);

    /*
     * Checks to see if one or more attributes have changed for a given Element.
     * When no attributes have changed, this is much faster than checking each
     * individual argument. When attributes have changed, the overhead of this is
     * minimal.
     */
    const attrsArr = data.attrsArr;
    const newAttrs = data.newAttrs;
    const isNew = !attrsArr.length;
    var i = ATTRIBUTES_OFFSET;
    var j = 0;

    if (!data.staticsApplied) {
        if (statics) {
            for (let i = 0; i < statics.length; i += 2) {
                const name = statics[i];
                const value = statics[i + 1];
                if (newAttrs[name] === undefined) {
                    delete newAttrs[name];
                }
                updateAttribute(node, name, value);
            }
        }
        data.staticsApplied = true;
    }

    for (; i < arguments.length; i += 2, j += 2) {
        const attr = arguments[i];
        if (isNew) {
            attrsArr[j] = attr;
            newAttrs[attr] = undefined;
        } else if (attrsArr[j] !== attr) {
            break;
        }

        const value = arguments[i + 1];
        if (isNew || attrsArr[j + 1] !== value) {
            attrsArr[j + 1] = value;
            updateAttribute(node, attr, value);
        }
    }

    if (i < arguments.length || j < attrsArr.length) {
        for (; i < arguments.length; i += 1, j += 1) {
            attrsArr[j] = arguments[i];
        }

        if (j < attrsArr.length) {
            attrsArr.length = j;
        }

        /**
         * Actually perform the attribute update.
         */
        for (i = 0; i < attrsArr.length; i += 2) {
            newAttrs[attrsArr[i]] = attrsArr[i + 1];
        }

        for (const attr in newAttrs) {
            updateAttribute(node, attr, newAttrs[attr]);
            newAttrs[attr] = undefined;
        }
    }

    return node;
};

/**
 * Declares a virtual Element at the current location in the document. This
 * corresponds to an opening tag and a elementClose tag is required. This is
 * like elementOpen, but the attributes are defined using the attr function
 * rather than being passed as arguments. Must be folllowed by 0 or more calls
 * to attr, then a call to elementOpenEnd.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 */
var elementOpenStart = function(tag, key, statics, var_args) {
    if (process.env.NODE_ENV !== 'production') {
        assertNotInAttributes('elementOpenStart');
        setInAttributes(true);
    }

    argsBuilder[0] = tag;
    argsBuilder[1] = key;
    argsBuilder[2] = statics;

    var i = ATTRIBUTES_OFFSET;
    for (; i < arguments.length; i++) {
        argsBuilder[i] = arguments[i];
    }
};

/***
 * Defines a virtual attribute at this point of the DOM. This is only valid
 * when called between elementOpenStart and elementOpenEnd.
 *
 * @param {string} name
 * @param {*} value
 */
var attr = function(name, value) {
    if (process.env.NODE_ENV !== 'production') {
        assertInAttributes('attr');
    }

    argsBuilder.push(name, value);
};

/**
 * Closes an open tag started with elementOpenStart.
 * @return {!Element} The corresponding Element.
 */
var elementOpenEnd = function() {
    if (process.env.NODE_ENV !== 'production') {
        assertInAttributes('elementOpenEnd');
        setInAttributes(false);
    }

    var node = elementOpen.apply(null, argsBuilder);
    argsBuilder.length = 0;
    return node;
};

/**
 * Closes an open virtual Element.
 *
 * @param {string} tag The element's tag.
 * @return {!Element} The corresponding Element.
 */
var elementClose = function(tag) {
    if (process.env.NODE_ENV !== 'production') {
        assertNotInAttributes('elementClose');
    }

    var node = coreElementClose();

    if (process.env.NODE_ENV !== 'production') {
        assertCloseMatchesOpenTag(getData(node).nodeName, tag);
    }

    return node;
};

/**
 * Declares a virtual Element at the current location in the document that has
 * no children.
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
 *     static attributes for the Element. These will only be set once when the
 *     Element is created.
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {!Element} The corresponding Element.
 */
var elementVoid = function(tag, key, statics, var_args) {
    elementOpen.apply(null, arguments);
    skip();
    return elementClose(tag);
};

var ref = id => element => {
    let comp = currentComponent();
    if (process.env.NODE_ENV !== 'production') {
        if (!comp || !comp.refs) {
            throw new Error('ref() must be used within a component');
        }
    }
    comp.refs[id] = element;
    return {
        unsubscribe() {
            if (!comp) {
                return;
            }
            comp = null;
        },
    };
};

/**
 * Creates a new RawString that may contain HTML that should be rendered
 * as is and should not be escaped.
 *
 * @param {string} value The wrapped String.
 * @class
 */
var RawString = function(value) {
    this.value = value;
};

/**
 * Return the wrapped value of the raw string.
 */
RawString.prototype.toString = function() {
    return this.value;
};

/**
 * Creates a new RawString that may contain HTML that should be rendered
 * as is and should not be escaped.
 *
 * @param {string} value The wrapped String.
 */
var rawString = function(value) {
    if (value instanceof RawString) {
        return value;
    }
    if (process.env.NODE_ENV !== 'production') {
        if (typeof value !== 'string') {
            throw new Error(
                'Tried to create a RawString from non-string value: ' +
                    JSON.stringify(value)
            );
        }
    }
    return new RawString(value);
};

/**
 * Declares a virtual Text at this point in the document.
 *
 * @param {string|number|boolean|RawString} value The value of the Text.
 * @param {...(function((string|number|boolean)):string)} var_args
 *     Functions to format the value which are called only when the value has
 *     changed.
 * @return {!Text} The corresponding text node.
 */
var text = function(value, var_args) {
    if (process.env.NODE_ENV !== 'production') {
        assertNotInAttributes('text');
        assertNotInSkip('text');
    }

    if (value instanceof RawString) {
        if (process.env.NODE_ENV !== 'production') {
            if (arguments.length > 1) {
                throw new Error("Can't call filters on a raw string.");
            }
        }
        return raw(value.value);
    }

    var node = coreText();
    var data = getData(node);

    if (data.text !== value) {
        data.text /** @type {string} */ = value;

        var formatted = value;
        for (var i = 1; i < arguments.length; i += 1) {
            /*
             * Call the formatter function directly to prevent leaking arguments.
             * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
             */
            var fn = arguments[i];
            formatted = fn(formatted);
        }

        node.data = formatted;
    }

    return node;
};

var raw = function(value) {
    if (process.env.NODE_ENV !== 'production') {
        assertNotInAttributes('text');
        assertNotInSkip('text');
    }

    return coreRaw(value);
};

/** */
export {
    elementOpenStart,
    elementOpenEnd,
    elementOpen,
    elementVoid,
    elementClose,
    text,
    attr,
    ref,
    raw,
    rawString,
};
