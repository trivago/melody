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

/**
 * Keeps track whether or not we are in an attributes declaration (after
 * elementOpenStart, but before elementOpenEnd).
 * @type {boolean}
 */
var inAttributes = false;

/**
 * Keeps track whether or not we are in an element that should not have its
 * children cleared.
 * @type {boolean}
 */
var inSkip = false;

/**
 * Makes sure that there is a current patch context.
 * @param {*} context
 */
var assertInPatch = function(functionName, context) {
    if (!context) {
        throw new Error('Cannot call ' + functionName + '() unless in patch');
    }
};

/**
 * Makes sure that a patch closes every node that it opened.
 * @param {?Node} openElement
 * @param {!Node|!DocumentFragment} root
 */
var assertNoUnclosedTags = function(openElement, root) {
    if (openElement === root) {
        return;
    }

    var currentElement = openElement;
    var openTags = [];
    while (currentElement && currentElement !== root) {
        openTags.push(currentElement.nodeName.toLowerCase());
        currentElement = currentElement.parentNode;
    }

    throw new Error(
        'One or more tags were not closed:\n' + openTags.join('\n')
    );
};

/**
 * Makes sure that the caller is not where attributes are expected.
 * @param {string} functionName
 */
var assertNotInAttributes = function(functionName) {
    if (inAttributes) {
        throw new Error(
            functionName +
                '() can not be called between ' +
                'elementOpenStart() and elementOpenEnd().'
        );
    }
};

/**
 * Makes sure that the caller is not inside an element that has declared skip.
 * @param {string} functionName
 */
var assertNotInSkip = function(functionName) {
    if (inSkip) {
        throw new Error(
            functionName +
                '() may not be called inside an element ' +
                'that has called skip().'
        );
    }
};

/**
 * Makes sure that the caller is where attributes are expected.
 * @param {string} functionName
 */
var assertInAttributes = function(functionName) {
    if (!inAttributes) {
        throw new Error(
            functionName +
                '() can only be called after calling ' +
                'elementOpenStart().'
        );
    }
};

/**
 * Makes sure the patch closes virtual attributes call
 */
var assertVirtualAttributesClosed = function() {
    if (inAttributes) {
        throw new Error(
            'elementOpenEnd() must be called after calling ' +
                'elementOpenStart().'
        );
    }
};

/**
 * Makes sure that tags are correctly nested.
 * @param {string} nodeName
 * @param {string} tag
 */
var assertCloseMatchesOpenTag = function(nodeName, tag) {
    if (nodeName !== tag) {
        throw new Error(
            'Received a call to close "' +
                tag +
                '" but "' +
                nodeName +
                '" was open.'
        );
    }
};

/**
 * Makes sure that no children elements have been declared yet in the current
 * element.
 * @param {string} functionName
 * @param {?Node} previousNode
 */
var assertNoChildrenDeclaredYet = function(functionName, previousNode) {
    if (previousNode !== null) {
        throw new Error(
            functionName +
                '() must come before any child ' +
                'declarations inside the current element.'
        );
    }
};

/**
 * Checks that a call to patchOuter actually patched the element.
 * @param {?Node} node The node requested to be patched.
 * @param {?Node} previousNode The previousNode after the patch.
 */
var assertPatchElementNoExtras = function(
    startNode,
    currentNode,
    expectedNextNode,
    expectedPrevNode
) {
    const wasUpdated =
        currentNode.nextSibling === expectedNextNode &&
        currentNode.previousSibling === expectedPrevNode;
    const wasChanged =
        currentNode.nextSibling === startNode.nextSibling &&
        currentNode.previousSibling === expectedPrevNode;
    const wasRemoved = currentNode === startNode;

    if (!wasUpdated && !wasChanged && !wasRemoved) {
        throw new Error(
            'There must be exactly one top level call corresponding ' +
                'to the patched element.'
        );
    }
};

/**
 * Updates the state of being in an attribute declaration.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInAttributes = function(value) {
    var previous = inAttributes;
    inAttributes = value;
    return previous;
};

/**
 * Updates the state of being in a skip element.
 * @param {boolean} value
 * @return {boolean} the previous value.
 */
var setInSkip = function(value) {
    var previous = inSkip;
    inSkip = value;
    return previous;
};

/** */
export {
    assertInPatch,
    assertNoUnclosedTags,
    assertNotInAttributes,
    assertInAttributes,
    assertCloseMatchesOpenTag,
    assertVirtualAttributesClosed,
    assertNoChildrenDeclaredYet,
    assertNotInSkip,
    assertPatchElementNoExtras,
    setInAttributes,
    setInSkip,
};
