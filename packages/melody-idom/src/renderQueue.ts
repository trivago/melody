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
import { patchOuter, updateComponent, RenderableComponent } from './core';
import { getParent } from './hierarchy';
import { debounce } from 'lodash';
import options from './options';
interface Node {
    component: RenderableComponent;
    next: Node;
}

export interface Deadline {
    didTimeout: boolean;
    timeRemaining(): number;
}

interface WhatWGEventListenerArgs {
    capture?: boolean;
}

interface WhatWGAddEventListenerArgs extends WhatWGEventListenerArgs {
    passive?: boolean;
    once?: boolean;
}

type WhatWGAddEventListener = (
    type: string,
    listener: (event: Event) => void,
    options?: WhatWGAddEventListenerArgs
) => void;

let supportsPassiveListeners = false;
/* istanbul ignore next */
(document.createElement('div').addEventListener as WhatWGAddEventListener)(
    'test',
    function() {},
    {
        get passive() {
            supportsPassiveListeners = true;
            return false;
        },
    }
);

const BUSY_FRAME_LENGTH = 3;
const IDLE_FRAME_LENGTH = 30;
const MESSAGE_KEY =
    '__melodyPrioritize_' +
    Math.random()
        .toString(36)
        .slice(2);
export const mountedComponents = new WeakSet<RenderableComponent>();

// by default we assume that we have to deal with a busy frame
// we can afford a little more time if we can detect that the
// browser is currently idle (=not scrolling)
let idealFrameLength = IDLE_FRAME_LENGTH;
let scrollListenerAttached = false;
let prioritizationRequested = false;
let prioritizationDisabled = !!options.experimentalSyncDeepRendering;

const NIL: Node = { component: null, next: null };
let queue: Node = NIL;

function isEmpty(): boolean {
    return queue === NIL;
}

function addToQueue(component: RenderableComponent): void {
    if (queue !== NIL) {
        // before we schedule this update, we should check a few things first
        for (let head = queue; head !== NIL; head = head.next) {
            // 1: Has this component already been scheduled for an update?
            if (head.component === component) {
                // if so: we don't need
                return;
            }

            if (component.type !== 'streaming') {
                // 2: Is the parent of this component already scheduled for an update?
                if (getParent(component) === head.component) {
                    // if so: we don't need to do anything
                    return;
                }

                // 3: Is the component a parent of a node within the queue?
                if (getParent(head.component) === component) {
                    // if so: replace the child with its parent
                    head.component = component;
                    return;
                }
            }

            if (head.next === NIL) {
                // insert the new node at the end of the list
                // we probably want to adjust that once we know how
                // to prioritize an update
                head.next = {
                    component,
                    next: NIL,
                };
                break;
            }
        }
    } else {
        queue = {
            component,
            next: NIL,
        };
    }
}

export function drop(component: RenderableComponent): void {
    if (queue === NIL) {
        return;
    }
    if (queue.component === component) {
        queue = queue.next;
    }
    let prev = queue;
    for (let head = queue.next; head && head !== NIL; head = head.next) {
        // is the component (or one of its parents) in the queue the removed component?
        let comp = head.component;
        do {
            if (comp === component) {
                // if so: drop it
                prev.next = head.next;
                head = prev;
                break;
            }
            comp = getParent(comp);
        } while (comp);
        prev = head;
    }
}

function getPriority(node: Node): number {
    if (!node.component.el) {
        return -1;
    }
    const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
    const { top, bottom } = node.component.el.getBoundingClientRect();

    // is fully visible
    if (
        (0 < top && bottom < windowHeight) ||
        (top < 0 && windowHeight < bottom)
    ) {
        return 0;
    }

    // bottom of component is visible
    if (top < 0 && 0 < bottom && bottom < windowHeight) {
        return 1;
    }

    // top of component is visible
    if (0 < top && top < windowHeight) {
        return 2;
    }

    // not visible, not new
    return 3;
}

function prioritizeQueue(queue: Node): Node {
    const buckets = new Array(4);

    for (let head = queue; head !== NIL; head = head.next) {
        const bucketIndex = getPriority(head);
        if (bucketIndex < 0) {
            continue;
        }
        const clone = { component: head.component, next: NIL };
        if (!buckets[bucketIndex]) {
            buckets[bucketIndex] = { first: clone, last: clone };
        } else {
            buckets[bucketIndex].last.next = clone;
            buckets[bucketIndex].last = clone;
        }
    }

    return buckets.reduceRight(concatWithKnownLast, NIL);
}

function concatWithKnownLast(queue: Node, { first, last }): Node {
    const newList = concat(last, queue);
    return newList === last ? first : newList;
}

function concat(queue: Node, nextQueue: Node): Node {
    if (queue === NIL) {
        return nextQueue;
    }
    let p = queue;
    while (p.next !== NIL) {
        if (nextQueue === NIL) {
            return queue;
        }
        if (nextQueue.component === p.component) {
            nextQueue = nextQueue.next;
        } else {
            let prev = nextQueue;
            for (
                let head = nextQueue.next;
                head && head !== NIL;
                head = head.next
            ) {
                if (head.component === p.component) {
                    prev.next = head.next;
                    break;
                }
                prev = head;
            }
        }
        p = p.next;
    }
    p.next = nextQueue;

    return queue;
}

function pop(): Node | null {
    if (isEmpty()) {
        return null;
    }
    const head = queue;
    queue = queue.next;
    return head;
}

let isTicking = false;
function tick(callback: (deadline: Deadline) => void): void {
    if (isTicking) {
        return;
    }
    isTicking = true;
    requestAnimationFrame(() => {
        const startTime = Date.now();
        callback({
            didTimeout: false,
            timeRemaining() {
                return Math.max(0, idealFrameLength - (Date.now() - startTime));
            },
        });
    });
}

function drain(): Array<RenderableComponent> {
    let next = pop();
    const mounted = [];
    while (next) {
        if (next.component.el) {
            patchOuter(
                next.component.el,
                _ => updateComponent(next.component),
                {}
            );
            mounted.push(next.component);
        }
        next = pop();
    }
    return mounted;
}

export function flush(deadline: Deadline): void {
    let prevQueue;
    let next = pop();
    let hasNew = false;
    const mounted = new Set<RenderableComponent>();
    while (next) {
        prevQueue = queue;
        queue = NIL;

        if (next.component.el) {
            const isNew = next.component.el.localName === 'm-placeholder';
            patchOuter(
                next.component.el,
                _ => updateComponent(next.component),
                {}
            );
            mounted.add(next.component);
            if (isNew && queue !== NIL) {
                const drained = drain();
                for (let i = 0; i < drained.length; i++) {
                    mounted.add(drained[i]);
                }
                queue = NIL;
            }
        }

        if (queue !== NIL) {
            hasNew = true;
        }
        queue = concat(queue, prevQueue);

        if (options.experimentalSyncDeepRendering) {
            next = pop();
        } else {
            next = 0 < deadline.timeRemaining() ? pop() : null;
        }
    }
    // notify the freshly mounted components
    const notified = mounted.values();
    for (
        let current = notified.next();
        !current.done;
        current = notified.next()
    ) {
        const comp = current.value;
        if (comp.el) {
            mountedComponents.add(comp);
            comp.notify();
        }
    }
    isTicking = false;
    if (!isEmpty()) {
        if (!prioritizationDisabled && !prioritizationRequested && hasNew) {
            prioritizationRequested = true;
            window.postMessage(MESSAGE_KEY, '*');
        }
        tick(flush);
    }
}

export function clear() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error(
            'Clearing the queue is only allowed within a test environment.'
        );
    }
    queue = NIL;
}

function performReordering(event: MessageEvent): void {
    if (event.source !== this || event.data !== MESSAGE_KEY) {
        return;
    }
    prioritizationRequested = false;

    let timeSpent = Date.now();
    queue = prioritizeQueue(queue);
    timeSpent = Date.now() - timeSpent;

    // Usually prioritization takes 0 - 4 ms on fast browsers. If browser is not
    // able to do that (like Edge/IE) in this period skip the process.
    if (timeSpent > 10) {
        prioritizationDisabled = true;
    }
}

window.addEventListener('message', performReordering, false);

export function enqueueComponent(component: RenderableComponent): void {
    /* istanbul ignore if */
    if (supportsPassiveListeners && !scrollListenerAttached) {
        attachScrollListener();
    }

    addToQueue(component);
    /* istanbul ignore else */
    if (process.env.NODE_ENV === 'test') {
        return;
    }
    tick(flush);
}

/* istanbul ignore next */
var detectIdleCallback = debounce(function detectIdleCallback() {
    idealFrameLength = IDLE_FRAME_LENGTH;
}, 300);

/* istanbul ignore next */
function attachScrollListener(): void {
    scrollListenerAttached = true;
    // if we can detect when the browser is busy
    // then we can assume its idle by default
    idealFrameLength = IDLE_FRAME_LENGTH;
    (document.addEventListener as WhatWGAddEventListener)(
        'scroll',
        function() {
            idealFrameLength = BUSY_FRAME_LENGTH;
            detectIdleCallback();
        },
        { passive: true }
    );
}
