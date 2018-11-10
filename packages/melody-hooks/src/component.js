/**
 * Copyright 2018 trivago N.V.
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

import { enqueueComponent, options } from 'melody-idom';
import { shallowEquals, shallowEqualsScalar } from './util/shallowEquals';
import { setCurrentComponent, unsetCurrentComponent } from './util/hooks';
import {
    HOOK_TYPE_USE_EFFECT,
    HOOK_TYPE_USE_REF,
    RENDER_LIMIT,
} from './constants';

const { afterUpdate, afterMount } = options;
const defaultComponentFn = props => props;

function Component(element, componentFn) {
    // part of the public API
    this.el = element;

    // the component function is called before the component
    // is enqued for rendering. It returns the data that is
    // passed to the template. If we don't get a component
    // function we us the default component function which
    // just forwards the received props
    this.componentFn = componentFn ? componentFn : defaultComponentFn;
    // tracks whether we are in the phase of calling
    // the component function
    this.isRunningComponentFn = false;
    // tracks whether we are in the phase of calling
    // the hooks for the first time.
    this.isCollectingHooks = true;
    // tracks whether we are in the phase of running effects
    this.isRunningEffects = false;
    // stores the data returned from `componentFn`
    this.data = null;

    // stores the hooks internal configuration and state
    this.hooks = [];
    // tracks which hook is currently running
    this.hooksPointer = -1;

    // the props the we receive from the parent
    this.props = null;
    // receiving new props marks the props as dirty
    this.isPropsDirty = false;

    // the internal state object stores the state
    // for every `useState` hook by its slot index
    this.state = Object.create(null);
    // when `setState` is called we first store
    // the state in a queue and if we don't see
    // anymore updates we render the component
    // with the new state
    this.stateQueue = Object.create(null);
    // Calling `setState` will mark the state as dirty.
    this.isStateDirty = false;
    // Binds the `setState` function to our component instance
    this.setState = this.setState.bind(this);

    // tracks whether this component is mounted and
    // attached to the DOM
    this.isMounted = false;
}

Object.assign(Component.prototype, {
    /**
     * Set new properties for the Component.
     * This might cause the component to request an update.
     * @param {*} props new properties
     */
    apply(props) {
        if (shallowEquals(props, this.props)) {
            return;
        }
        this.props = props || null;
        this.isPropsDirty = true;
        this.enqueueComponent();
    },

    /**
     * Executed after a component has been mounted or updated.
     * After this method has been triggered, the component is
     * considered stable and accessing the DOM should be safe.
     * The children of this Component might not have been rendered.
     */
    notify() {
        if (this.isMounted) {
            if (options.afterUpdate) afterUpdate(this);
        } else {
            this.isMounted = true;
            if (afterMount) afterMount(this);
        }

        const hooks = this.hooks;

        // Mark this component as in running effects
        // This is needed in order to not immediately enqueue
        // the component again when `setState` is called while
        // we are running the effects
        this.isRunningEffects = true;

        // Run through hooks and call effects
        for (let i = 0, l = hooks.length; i < l; i++) {
            const hook = hooks[i];
            const type = hook[0];

            // We are only interested in effect hooks
            if (type !== HOOK_TYPE_USE_EFFECT) {
                continue;
            }

            const dirty = hook[3];

            // If this effect hook is not marked as
            // `dirty` we can skip the invocation.
            // A hook is considered `dirty` when the
            // input values have changed
            if (!dirty) continue;

            const callback = hook[1];
            const unsubscribe = hook[4];

            // If the hook returned an `unsubscribe`
            // function the first time it was called,
            // we need to invoke it first
            if (unsubscribe) {
                unsubscribe();
            }

            // Call the effect and store a potential
            // `unsubscribe` function for later use
            const unsubscribeNext = callback() || null;
            hook[4] = unsubscribeNext;
        }

        // Reset `isRunningEffects`
        this.isRunningEffects = false;

        // If `setState` was called during the effects,
        // we enqueue the component for rendering.
        if (this.isStateDirty) {
            this.enqueueComponent();
        }
    },

    /**
     * Enqeues a state change for a hook slot at index `hookIndex`
     * @param {*} hookIndex Index of the `useState` hook
     * @param {*} valueNext Updated value for this state hook
     * @return void
     */
    setState(hookIndex, valueNext) {
        // Store the new state in the queue
        const finalValue =
            typeof valueNext === 'function'
                ? valueNext(this.state[hookIndex])
                : valueNext;

        this.stateQueue[hookIndex] = finalValue;
        // Mark the state as dirty
        this.isStateDirty = true;

        // If `setState` was called outside of an effect or the
        // component function, we need to enqueue the component manually.
        if (!this.isRunningEffects && !this.isRunningComponentFn) {
            this.enqueueComponent();
        }
    },

    /**
     * Run through the state queue and update the state slots
     * only when a slot actually has changed. Returns a Boolean
     * indicating whether the state has changed or not.
     */
    flushState() {
        const { state, stateQueue, isStateDirty } = this;
        if (!isStateDirty) {
            // `setState` was not called, we can return early
            return false;
        }

        // Tracks if at least one state slot has changed
        let changed = false;

        // Run through stateQueue and check if the state
        // actually has changed
        for (const hookIndex in stateQueue) {
            const value = state[hookIndex];
            const valueNext = stateQueue[hookIndex];

            // Shallow equal check if the value at
            // this slot has changed.
            if (!shallowEqualsScalar(value, valueNext)) {
                // The state has changed, update the slot
                state[hookIndex] = valueNext;
                changed = true;
            }
        }

        // Reset the state queue
        this.stateQueue = Object.create(null);

        // Return whether the state has changed or not
        return changed;
    },

    /**
     * Enqueues the component for rendering. In this phase
     * the component function is called as long as we don't
     * see any more state changes
     */
    enqueueComponent() {
        // Mark this component as `currentComponent`, so hooks
        // can access the instance
        setCurrentComponent(this);

        // Let the component know that we are now running
        // the component functions. This is needed in order
        // to not directly enque the component again when
        // `setState` is called inside the component function
        this.isRunningComponentFn = true;

        // tracks if we at least run the component function once
        let updated = false;

        // tracks how often we did call the component function
        // due to calls to `setState` in the component function.
        let i = 0;

        while (
            // The state has changed
            this.flushState() ||
            // We received new props
            this.isPropsDirty ||
            // The component function was never invoked
            this.isCollectingHooks
        ) {
            if (i++ > RENDER_LIMIT) {
                throw new Error(
                    'Too many re-renders. Melody limits the number of renders to prevent ' +
                        'an infinite loop.'
                );
            }
            // the state is now not considered dirty anymore
            this.isStateDirty = false;
            // the props is now not considered dirty anymore
            this.isPropsDirty = false;

            // Reset the hooks pointer
            this.hooksPointer = -1;
            // Run the component functions
            this.data = this.componentFn(this.props) || {};

            // Mark that we have already collected the hooks
            // This only may happen once.
            this.isCollectingHooks = false;

            // mark that we have run the component function at least once
            updated = true;
        }

        // Let the component know that we are not running
        // the component function anymore
        this.isRunningComponentFn = false;

        // We are done with running the hooks and we
        // remove the reference to our instance
        unsetCurrentComponent();

        // When we have seen an update and we have an element
        // we send the component to the rendering queue.
        if (updated && this.el) {
            enqueueComponent(this);
        }
    },

    /**
     * Invoked when a component should render itself.
     */
    render() {},

    /**
     * Invoked before a component is unmounted.
     */
    componentWillUnmount() {
        const hooks = this.hooks;

        // Run through hooks that need clean up logic
        for (let i = 0, l = hooks.length; i < l; i++) {
            const hook = hooks[i];
            const type = hook[0];
            switch (type) {
                // Call potential unsubscribe functions for effects
                case HOOK_TYPE_USE_EFFECT: {
                    const unsubscribe = hook[4];
                    if (unsubscribe) unsubscribe();
                    break;
                }
                // Unset references to DOM elements
                case HOOK_TYPE_USE_REF: {
                    const ref = hook[1];
                    ref.current = undefined;
                    break;
                }
                default: {
                    continue;
                }
            }
        }
        // Unset hooks
        this.hooks = undefined;
    },
});

const createComponentConstructor = (Parent, parentComponentFn) => {
    function ChildComponent(el, componentFn) {
        Parent.call(this, el, componentFn || parentComponentFn);
    }
    ChildComponent.prototype = Object.create(Parent.prototype, {
        constructor: { value: ChildComponent },
    });
    return ChildComponent;
};

export const createComponent = (templateFnOrObj, componentFn) => {
    const template = templateFnOrObj.render
        ? props => templateFnOrObj.render(props)
        : templateFnOrObj;

    const ChildComponent = createComponentConstructor(Component, componentFn);

    ChildComponent.prototype.displayName =
        template.name || template.displayName || 'Unknown';

    ChildComponent.prototype.render = function() {
        return template(this.data);
    };

    return ChildComponent;
};
