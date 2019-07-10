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
import { createElement, createText, createRaw } from './nodes';
import { getData } from './node_data';
import {
    assertInPatch,
    assertNoUnclosedTags,
    assertNotInAttributes,
    assertVirtualAttributesClosed,
    assertNoChildrenDeclaredYet,
    assertPatchElementNoExtras,
    setInAttributes,
    setInSkip,
} from './assertions';
import { getFocusedPath, moveBefore } from './dom_util';
import { unmountComponent } from './util';
import { enqueueComponent } from './renderQueue';
import { link, reset } from './hierarchy';

type Class<T> = { new (): T };

export interface CallableComponent {
    apply(props: any): void;
    el: Element;
}

export interface RenderableComponent {
    el: Element;
    refs: any;
    render(): void;
    notify(): void;
    type: String;
}

/** @type {?Node} */
var currentNode;

/** @type {?Node} */
var currentParent;

/** @type {?Document} */
var doc;

var componentKey = null;
var currentComponent = null;

var deletedNodes: Array<Node> = null;

const markFocused = function(focusPath: Array<Node>, focused: boolean): void {
    for (let i = 0; i < focusPath.length; i += 1) {
        getData(focusPath[i]).focused = focused;
    }
};

const patchFactory = function(run) {
    return function(node, fn, data) {
        if (process.env.NODE_ENV !== 'production') {
            if (!node) {
                throw new Error('Patch invoked without an element.');
            }
        }
        const prevDeletedNodes = deletedNodes;
        const prevDoc = doc;
        const prevCurrentNode = currentNode;
        const prevCurrentParent = currentParent;
        const prevCurrentComponent = currentComponent;

        let previousInAttribute = false;
        let previousInSkip = false;

        deletedNodes = [];
        doc = node.ownerDocument;
        currentParent = node.parentNode;

        if (process.env.NODE_ENV !== 'production') {
            previousInAttribute = setInAttributes(false);
            previousInSkip = setInSkip(false);
        }

        const focusPath = getFocusedPath(node, currentParent);
        markFocused(focusPath, true);
        let retVal;
        if (process.env.NODE_ENV !== 'production') {
            try {
                retVal = run(node, fn, data);
            } catch (e) {
                // reset context
                deletedNodes = prevDeletedNodes;
                doc = prevDoc;
                currentNode = prevCurrentNode;
                currentParent = prevCurrentParent;
                currentComponent = prevCurrentComponent;
                // rethrow the error
                throw e;
            }
        } else {
            retVal = run(node, fn, data);
        }

        markFocused(focusPath, false);

        if (process.env.NODE_ENV !== 'production') {
            assertVirtualAttributesClosed();
            setInAttributes(previousInAttribute);
            setInSkip(previousInSkip);
        }

        var i, len;
        for (i = 0, len = deletedNodes.length; i < len; i++) {
            nodeDeleted(deletedNodes[i]);
        }

        // reset context
        deletedNodes = prevDeletedNodes;
        doc = prevDoc;
        currentNode = prevCurrentNode;
        currentParent = prevCurrentParent;
        currentComponent = prevCurrentComponent;

        return retVal;
    };
};

function nodeDeleted(node) {
    const data = getData(node);
    if (data.attrs.ref && data.attrs.ref.disposer) {
        data.attrs.ref.disposer.unsubscribe();
        data.attrs.ref = null;
    }
    if (data.componentInstance) {
        unmountComponent(data.componentInstance);
    }
    // not an ideal solution but we can eventually move it
    // towards a scheduler (perhaps `requestIdleCallback` if we notice
    // that there are actual issues with this)
    // Chose a recursive solution here to avoid unnecessary memory usage
    let child = node.firstChild;
    while (child) {
        nodeDeleted(child);
        child = child.nextSibling;
    }
}

const patchInner = patchFactory(function(node, fn, data) {
    currentNode = node;
    enterNode();
    fn(data);
    exitNode();

    if (process.env.NODE_ENV !== 'production') {
        assertNoUnclosedTags(currentNode, node);
    }

    return node;
});

const patchOuter = patchFactory(function(node, fn, data) {
    const startNode = { nextSibling: node };
    let expectedNextNode = null;
    let expectedPrevNode = null;

    if (process.env.NODE_ENV !== 'production') {
        expectedNextNode = node.nextSibling;
        expectedPrevNode = node.previousSibling;
    }

    currentNode = startNode;
    fn(data);

    if (process.env.NODE_ENV !== 'production') {
        assertPatchElementNoExtras(
            startNode,
            currentNode,
            expectedNextNode,
            expectedPrevNode
        );
    }

    if (node !== currentNode && node.parentNode) {
        removeChild(currentParent, node, getData(currentParent).keyMap);
    }

    return startNode === currentNode ? null : currentNode;
});

/**
 * Checks whether or not the current node matches the specified nodeName and
 * key.
 *
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string=} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function(
    matchNode: Node,
    nodeName: string,
    key?: string
): boolean {
    var data = getData(matchNode);

    // Key check is done using double equals as we want to treat a null key the
    // same as undefined. This should be okay as the only values allowed are
    // strings, null and undefined so the == semantics are not too weird.
    // templates rendered on the server side may not have keys at all while melody templates
    // always will have them so we reconcile the dom in those cases.
    if (nodeName === data.nodeName) {
        if (key == data.key) {
            return true;
        }
        // exisiting DOM element does not have a key
        // which means we can hook onto it freely
        if (!data.key) {
            data.key = key;
            data.staticsApplied = false;
            // but we'll need to update the parent element
            const parentKeys = currentParent && getData(currentParent).keyMap;
            if (parentKeys) {
                parentKeys[key] = matchNode;
            }
            return true;
        }
    }
    return false;
};

/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string=} key The key used to identify this element.
 * @param {?Array<*>=} statics For an Element, this should be an array of
 *     name-value pairs.
 */
var alignWithDOM = function(nodeName: string, key?: string): void {
    if (currentNode && matches(currentNode, nodeName, key)) {
        return;
    }

    const parentData = getData(currentParent);
    const currentNodeData = currentNode && getData(currentNode);
    const keyMap = parentData.keyMap;
    let fromKeyMap = false;
    let node;
    let componentInstance = null;

    // Check to see if the node has moved within the parent.
    if (key) {
        const keyNode = keyMap[key];
        if (keyNode) {
            if (matches(keyNode, nodeName, key)) {
                fromKeyMap = true;
                node = keyNode;
            } else if (keyNode === currentNode) {
                const keyNodeData = getData(keyNode);
                // if (keyNodeData.componentInstance === currentComponent) {
                if (keyNodeData.componentInstance) {
                    componentInstance = keyNodeData.componentInstance;
                    keyNodeData.componentInstance = null;
                } else {
                    deletedNodes.push(keyNode);
                }
            } else {
                removeChild(currentParent, keyNode, keyMap);
            }
        } else if (
            currentNode &&
            currentNode.nodeType === 3 &&
            currentNode.data.trim() === ''
        ) {
            // special handling here to ignore empty text nodes if the one after it is what we're actually looking for
            // this reduces a lot of special handling for server side rendered content.
            if (
                currentNode.nextSibling &&
                matches(currentNode.nextSibling, nodeName, key)
            ) {
                node = currentNode.nextSibling;
            }
        }
    }

    // Create the node if it doesn't exist.
    if (!node) {
        if (nodeName === '#text') {
            node = createText(doc);
        } else {
            node = createElement(doc, currentParent, nodeName, key);
        }

        if (key) {
            keyMap[key] = node;
        }
    }

    if (componentInstance) {
        getData(node).componentInstance = componentInstance;
        componentInstance.el = node;
    }

    // Re-order the node into the right position, preserving focus if either
    // node or currentNode are focused by making sure that they are not detached
    // from the DOM.
    if (getData(node).focused) {
        // move everything else before the node.
        moveBefore(currentParent, node, currentNode);
    } else if (
        !(fromKeyMap && !node.parentNode) &&
        currentNodeData &&
        currentNodeData.key &&
        !currentNodeData.focused
    ) {
        // Remove the currentNode, which can always be added back since we hold a
        // reference through the keyMap. This prevents a large number of moves when
        // a keyed item is removed or moved backwards in the DOM.
        currentParent.replaceChild(node, currentNode);
        parentData.keyMapValid = false;
    } else if (
        currentNode &&
        currentNode.nextSibling === node &&
        currentNode.nodeType === 3 &&
        currentNode.data.trim() === ''
    ) {
        // if the empty text node handling above was successful, we simply remove the skipped text node
        currentParent.removeChild(currentNode);
    } else {
        currentParent.insertBefore(node, currentNode);
    }

    currentNode = node;
};

const removeChild = function(node: Node, child: Node, keyMap): void {
    node.removeChild(child);
    deletedNodes.push(child);

    const key = getData(child).key;
    if (key) {
        delete keyMap[key];
    }
};

/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 */
var clearUnvisitedDOM = function(): void {
    var node = currentParent;
    var data = getData(node);
    var keyMap = data.keyMap;
    var keyMapValid = data.keyMapValid;
    var child = node.lastChild;
    var key;

    if (child === currentNode && keyMapValid) {
        return;
    }

    while (child && child !== currentNode) {
        removeChild(node, child, keyMap);
        child = node.lastChild;
    }

    // Clean the keyMap, removing any unusued keys.
    if (!keyMapValid) {
        for (key in keyMap) {
            child = keyMap[key];
            if (child.parentNode !== node) {
                deletedNodes.push(child);
                delete keyMap[key];
            }
        }

        data.keyMapValid = true;
    }
};

/**
 * Changes to the first child of the current node.
 */
var enterNode = function(): void {
    currentParent = currentNode;
    currentNode = null;
};

/**
 * Changes to the next sibling of the current node.
 */
var nextNode = function(): void {
    currentNode = getNextNode();
};

var getNextNode = function(): Node | null {
    if (currentNode) {
        return currentNode.nextSibling;
    } else {
        return currentParent.firstChild;
    }
};

/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var exitNode = function(): void {
    clearUnvisitedDOM();

    currentNode = currentParent;
    currentParent = currentParent.parentNode;
};

var updateComponent = function(comp: RenderableComponent): void {
    const data = getData(comp.el);
    const parentComponent = currentComponent;
    componentKey = data.key;

    reset(comp);

    currentComponent = comp;
    comp.render();

    currentComponent = parentComponent;
};

var scheduleComponent = function(
    Component: Class<CallableComponent> | CallableComponent,
    key: string,
    props: any,
    el?: Node
): any {
    var comp;
    if (el) {
        // we've already seen this component
        var data = getData(el);
        comp = data.componentInstance;
        if (!comp) {
            // but apparently we didn't have a component instance so far
            // most likely we're mounting a server side rendered DOM
            comp =
                typeof Component === 'function' ? new Component() : Component;
            comp.el = el;
            data.componentInstance = comp;
        }
        // Q: Do we even want to support this in the future?
        // if (typeof Component === 'function' && !(comp instanceof Component)) {
        //   unmountComponent(comp);
        //   comp = null;
        // }
        elementOpen(data.nodeName, key);
        skip();
        elementClose();
    } else {
        // unknown component
        if (typeof Component === 'function') {
            comp = new Component();
        } else {
            comp = Component;
        }

        elementOpen('m-placeholder', key);
        skip();
        comp.el = elementClose();
        getData(comp.el).componentInstance = comp;
    }

    if (currentComponent) {
        link(currentComponent, comp);
    }
    return comp.apply(props);
};

var component = function(
    Component: Class<CallableComponent> | CallableComponent,
    key: string,
    props: any
): any {
    var el = getData(currentParent).keyMap[key];
    return scheduleComponent(Component, key, props, el);
};

var getCurrentComponent = function(): RenderableComponent {
    return currentComponent;
};

var mount = function(
    element: Node,
    Component: Class<CallableComponent> | CallableComponent,
    props: any
): any {
    var data = getData(element);
    var key = data && data.key;
    var comp = data.componentInstance;
    var isComponentInstance = typeof Component !== 'function';
    // if the existing component is not an instance of the specified component type
    // then we just unmount the existing one and proceed as if none ever existed
    if (
        comp &&
        !isComponentInstance &&
        !(comp instanceof (Component as Class<CallableComponent>))
    ) {
        unmountComponent(comp);
    }
    return scheduleComponent(Component, key, props, element);
};

/**
 * Makes sure that the current node is an Element with a matching tagName and
 * key.
 *
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @return {!Element} The corresponding Element.
 */
var elementOpen = function(tag: string, key?: string) {
    nextNode();
    alignWithDOM(tag, componentKey || key);
    componentKey = null;
    enterNode();
    return currentParent;
};

/**
 * Closes the currently open Element, removing any unvisited children if
 * necessary.
 *
 * @return {!Element} The corresponding Element.
 */
var elementClose = function(): void {
    if (process.env.NODE_ENV !== 'production') {
        setInSkip(false);
    }

    exitNode();
    return currentNode;
};

/**
 * Makes sure the current node is a Text node and creates a Text node if it is
 * not.
 *
 * @return {!Text} The corresponding Text Node.
 */
var text = function(): Text {
    nextNode();
    alignWithDOM('#text', null);
    return currentNode;
};

/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
var currentElement = function(): Node {
    if (process.env.NODE_ENV !== 'production') {
        assertInPatch('currentElement', deletedNodes);
        assertNotInAttributes('currentElement');
    }
    return currentParent;
};

/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
var skip = function(): void {
    if (process.env.NODE_ENV !== 'production') {
        assertNoChildrenDeclaredYet('skip', currentNode);
        setInSkip(true);
    }
    currentNode = currentParent.lastChild;
};

var inPatch = function(): boolean {
    return !!deletedNodes;
};

const skipNode = nextNode;

var insertRawHtml = function(html: string): void {
    var children = createRaw(doc, html);
    var node = doc.createDocumentFragment(),
        lastChild = children[children.length - 1];
    while (children.length) {
        node.appendChild(children[0]);
    }
    currentParent.insertBefore(node, currentNode);
    currentNode = lastChild;
};

var raw = function(html: string): void {
    nextNode();
    if (currentNode && matches(currentNode, '#raw', null)) {
        // patch node
        var data = getData(currentNode),
            remainingSiblingCount = data.childLength - 1;
        if (data.text !== html) {
            // if the text is not the same as before, we'll have some work to do
            insertRawHtml(html);
            // remove the remaining siblings of the old child
            if (data.childLength > 1) {
                while (remainingSiblingCount--) {
                    currentParent.removeChild(currentNode.nextSibling);
                }
            }
        } else if (remainingSiblingCount) {
            // still the same text so just jump over the remaining siblings
            while (remainingSiblingCount--) {
                currentNode = currentNode.nextSibling;
            }
        }
    } else {
        // insert raw html
        insertRawHtml(html);
    }

    return currentNode;
};

/** */
export {
    elementOpen,
    elementClose,
    text,
    patchInner,
    patchOuter,
    currentElement,
    skip,
    skipNode,
    inPatch,
    raw,
    mount,
    component,
    getCurrentComponent as currentComponent,
    updateComponent,
    enqueueComponent,
};
