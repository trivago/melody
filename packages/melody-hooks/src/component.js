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
import { shallowEqual } from './util/shallowEqual';
import { setCurrentComponent, unsetCurrentComponent } from './util/hooks';
import { markStart, markEnd } from './util/performance';
import {
    HOOK_TYPE_USE_EFFECT,
    HOOK_TYPE_USE_REF,
    RENDER_LIMIT,
    HOOK_TYPE_USE_MUTATION_EFFECT,
    HOOK_LABEL_BY_TYPE,
} from './constants';

const { afterUpdate, afterMount } = options;

function Component(element, componentFn) {
    // part of the public API
    this.el = element;

    // the component function is called before the component
    // is enqued for rendering. It returns the data that is
    // passed to the template. If we don't get a component
    // function we us the default component function which
    // just forwards the received props
    if (!componentFn) {
        throw new Error(
            'Can not construct component without component function'
        );
    }
    this.componentFn = componentFn;
    // tracks whether we are in the phase of calling
    // the component function
    this.isRunningComponentFn = false;
    // tracks whether we are in the phase of calling
    // the hooks for the first time.
    this.isCollectingHooks = true;
    // tracks whether we are in the phase of running effects
    this.isRunningEffects = false;
    // tracks whether we are in the phase of running mutation effects
    this.isRunningMutationEffects = false;
    // stores the data returned from `componentFn`
    this.data = null;

    // stores the hooks internal configuration and state
    this.hooks = [];
    // tracks which hook is currently running
    this.hooksPointer = -1;

    // `this.props` need to be initialized with `undefined`
    // for first shallowEqual check in `apply`
    this.props = undefined;
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
    this.hasQueuedState = Object.create(null);
    // Calling `setState` will mark the state as dirty.
    this.isStateDirty = false;
    // Binds the `setState` function to our component instance
    this.setState = this.setState.bind(this);

    // tracks whether this component is mounted and
    // attached to the DOM
    this.isMounted = false;
    this.isUnmounted = false;

    // Tracks whether this component was enqued but never renderd
    this.needsRender = false;
}

Object.assign(Component.prototype, {
    /**
     * Set new properties for the Component.
     * This might cause the component to request an update.
     * @param {*} props new properties
     */
    apply(props) {
        // On the first call to apply `this.props` is `undefined`, thus
        // `isPropsDirty` will be true.
        const propsNext = props || {};
        this.isPropsDirty = !shallowEqual(propsNext, this.props);
        this.props = propsNext;
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

        this.runEffects();
    },

    /**
     * Runs the effect hooks
     */
    runEffectHooks(hookType) {
        const hooks = this.hooks;

        // Run through hooks and call effects
        for (let i = 0, l = hooks.length; i < l; i++) {
            const hook = hooks[i];
            const type = hook[0];

            // We are only interested in `hookType` hooks
            if (type !== hookType) {
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
            if (process.env.NODE_ENV !== 'production') {
                markStart(this, `${HOOK_LABEL_BY_TYPE[hookType]} (${i})`);
            }
            const unsubscribeNext = callback();
            if (process.env.NODE_ENV !== 'production') {
                markEnd(this, `${HOOK_LABEL_BY_TYPE[hookType]} (${i})`);
            }

            if (process.env.NODE_ENV !== 'production') {
                if (
                    unsubscribeNext !== undefined &&
                    typeof unsubscribeNext !== 'function'
                ) {
                    const hookLabel = HOOK_LABEL_BY_TYPE[type];
                    // eslint-disable-next-line no-console
                    console.warn(
                        `${hookLabel}: expected the unsubscribe callback to be ` +
                            `a function or undefined. Instead received ${typeof unsubscribeNext}.`
                    );
                }
            }

            // store new unsubscribe callback
            hook[4] = unsubscribeNext;

            // effect is not dirty anymore
            hook[3] = false;
        }
    },

    /**
     * Runs the `useEffect` hooks
     */
    runEffects() {
        // Mark this component as in running effects
        // This is needed in order to not immediately enqueue
        // the component again when `setState` is called while
        // we are running the effects
        this.isRunningEffects = true;
        this.runEffectHooks(HOOK_TYPE_USE_EFFECT);
        this.isRunningEffects = false;

        // If `setState` was called during the effects,
        // we enqueue the component for rendering.
        if (this.isStateDirty) {
            this.enqueueComponent();
        }
    },

    /**
     * Runs the `useMutationEffect` hooks
     */
    runMutationEffects() {
        // Mark this component as in running mutation effects
        // This is needed in order to not immediately enqueue
        // the component again when `setState` is called while
        // we are running the effects
        this.isRunningMutationEffects = true;
        this.runEffectHooks(HOOK_TYPE_USE_MUTATION_EFFECT);
        this.isRunningMutationEffects = false;
        // Usually we would check for `isStateDirty` here and
        // enqueue the component if so, but we don't allow
        // calls to `setState` inside a mutation effect in
        // order to avoid rendering performance issues
    },

    /**
     * Enqeues a state change for a hook slot at index `hookIndex`
     * @param {*} hookIndex Index of the `useState` hook
     * @param {*} valueNext Updated value for this state hook
     * @return void
     */
    setState(hookIndex, valueNext) {
        const {
            isUnmounted,
            state,
            stateQueue,
            hasQueuedState,
            isRunningMutationEffects,
        } = this;

        if (isUnmounted) {
            if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.warn(
                    'useState: a `setState` handler has been called even though the component ' +
                        'was already unmounted. This is probably due to a missing `unsubscribe` ' +
                        'callback of a `useEffect` or `useMutationEffect` hook.'
                );
            }
            return;
        }

        if (isRunningMutationEffects) {
            throw new Error(
                'Melody does not allow using `setState` in `useMutationEffect` ' +
                    'since this would harm rendering performance. This hook is meant ' +
                    'for manually mutating the DOM'
            );
        }

        // Store the new state in the queue
        let finalValue;
        if (typeof valueNext === 'function') {
            // We need `hasQueuedState` here because `stateQueue[hookIndex]`
            // could be set to `undefined` by a previous `setState`.
            const prevValue = hasQueuedState[hookIndex]
                ? stateQueue[hookIndex]
                : state[hookIndex];
            finalValue = valueNext(prevValue);
        } else {
            finalValue = valueNext;
        }

        stateQueue[hookIndex] = finalValue;
        hasQueuedState[hookIndex] = true;
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
            if (!shallowEqual(value, valueNext)) {
                // The state has changed, update the slot
                state[hookIndex] = valueNext;
                changed = true;
            }
        }

        // Reset the state queue
        this.stateQueue = Object.create(null);
        this.hasQueuedState = Object.create(null);

        // Return whether the state has changed or not
        return changed;
    },

    /**
     * Enqueues the component for rendering. In this phase
     * the component function is called as long as we don't
     * see any more state changes
     */
    enqueueComponent() {
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
            try {
                // Mark this component as `currentComponent`, so hooks
                // can access the instance
                setCurrentComponent(this);

                // Let the component know that we are now running
                // the component functions. This is needed in order
                // to not directly enque the component again when
                // `setState` is called inside the component function
                this.isRunningComponentFn = true;

                // the state is now not considered dirty anymore
                this.isStateDirty = false;

                // the props is now not considered dirty anymore
                this.isPropsDirty = false;

                // Reset the hooks pointer
                this.hooksPointer = -1;

                // Run the component functions
                if (process.env.NODE_ENV !== 'production') {
                    markStart(this, `componentFn (${i})`);
                }
                this.data = this.componentFn(this.props) || {};
                if (process.env.NODE_ENV !== 'production') {
                    markEnd(this, `componentFn (${i})`);
                }

                // Mark that we have already collected the hooks
                // This only may happen once.
                this.isCollectingHooks = false;

                // mark that we have run the component function at least once
                updated = true;
            } finally {
                // Let the component know that we are not running
                // the component function anymore
                this.isRunningComponentFn = false;

                // We are done with running the hooks and we
                // remove the reference to our instance
                unsetCurrentComponent();
            }
        }

        const shouldEnqueue = this.needsRender || updated;

        // When we have an element and we have seen an update or this
        // component was not rendered yet (even thought an update came in),
        // we send the component to the rendering queue.
        if (this.el && shouldEnqueue) {
            this.needsRender = true;
            enqueueComponent(this);
        }
    },

    /**
     * Invoked when a component should render itself.
     */
    render() {
        this.needsRender = false;

        if (process.env.NODE_ENV !== 'production') {
            markStart(this, 'render');
        }
        this.renderTemplate();
        if (process.env.NODE_ENV !== 'production') {
            markEnd(this, 'render');
        }

        // Run mutation effects immediately
        // after touching the DOM
        this.runMutationEffects();
    },

    /**
     * Renders the template;
     */
    renderTemplate() {},

    /**
     * Invoked before a component is unmounted.
     */
    componentWillUnmount() {
        const hooks = this.hooks;

        if (process.env.NODE_ENV !== 'production') {
            markStart(this, 'unmount');
        }

        // Run through hooks that need clean up logic
        for (let i = 0, l = hooks.length; i < l; i++) {
            const hook = hooks[i];
            const type = hook[0];
            switch (type) {
                // Call potential unsubscribe functions for effects
                case HOOK_TYPE_USE_EFFECT:
                case HOOK_TYPE_USE_MUTATION_EFFECT: {
                    const unsubscribe = hook[4];
                    if (typeof unsubscribe === 'function') {
                        unsubscribe();
                    }
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
        if (process.env.NODE_ENV !== 'production') {
            markEnd(this, 'unmount');
        }
        // Unset hooks
        this.isUnmounted = true;
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

const baseCreateComponent = (componentFn, templateFnOrObj) => {
    const template = templateFnOrObj.render
        ? props => templateFnOrObj.render(props)
        : templateFnOrObj;

    const ChildComponent = createComponentConstructor(Component, componentFn);

    ChildComponent.prototype.displayName =
        template.name || template.displayName || 'Unknown';

    ChildComponent.prototype.renderTemplate = function() {
        return template(this.data);
    };

    return ChildComponent;
};

export const createComponent = (...args) => {
    if (args.length >= baseCreateComponent.length) {
        return baseCreateComponent.apply(null, args);
    }
    return (...args2) => createComponent.apply(null, args.concat(args2));
};
