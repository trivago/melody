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
import { enqueueComponent, options } from 'melody-idom';
import {
    shallowEquals,
    shallowEqualsScalar,
    shallowEqualsArray,
} from './shallowEquals';

let currentComponent = null;

const HOOK_TYPE_USE_STATE = 1;
const HOOK_TYPE_USE_EFFECT = 2;

const enterHook = () => {
    if (!currentComponent) {
        throw new Error('Cannot use hooks outside of Component functions');
    }
    currentComponent.hooksPointer += 1;
};

export const useState = initialState => {
    enterHook();
    const { hooksPointer, hooks, state, setState } = currentComponent;

    if (!currentComponent.isMounted) {
        const setter = value => setState(hooksPointer, value);
        const value = initialState;
        hooks.push([HOOK_TYPE_USE_STATE, setter]);
        state[hooksPointer] = value;
        return [value, setter];
    }
    const setter = hooks[hooksPointer][1];
    const value = state[hooksPointer];
    return [value, setter];
};

export const useEffect = (callback, shouldUpdateOrDataArray) => {
    enterHook();
    const { hooksPointer, hooks } = currentComponent;

    if (!currentComponent.isMounted) {
        const dirty = true;
        const unsubscribe = null;
        hooks.push([
            HOOK_TYPE_USE_EFFECT,
            callback,
            shouldUpdateOrDataArray,
            dirty,
            unsubscribe,
        ]);
        return;
    }

    const dataPrev = hooks[hooksPointer][2];
    const dirty =
        shouldUpdateOrDataArray === true ||
        (shouldUpdateOrDataArray &&
            shouldUpdateOrDataArray.length &&
            !shallowEqualsArray(dataPrev, shouldUpdateOrDataArray));

    hooks[hooksPointer][2] = shouldUpdateOrDataArray;
    hooks[hooksPointer][3] = dirty;
};

function Component(element, componentFn) {
    // part of the public API
    this.el = element;
    this.refs = Object.create(null);

    // needed for this type of component
    this.componentFn = componentFn;
    this.hooks = [];
    this.hooksPointer = -1;
    this.isMounted = false;
    this.props = null;
    this.state = {};
    this.data = null;

    this.setState = this.setState.bind(this);
}

Object.assign(Component.prototype, {
    /**
     * Set new properties for the Component.
     * This might cause the component to request an update.
     */
    apply(props) {
        if (shallowEquals(props, this.props)) {
            return;
        }
        this.props = props || null;
        this.enqueueComponent();
    },

    /**
     * Executed after a component has been mounted or updated.
     * After this method has been triggered, the component is considered stable and
     * accessing the DOM should be safe.
     * The children of this Component might not have been rendered.
     */
    notify() {
        const hooks = this.hooks;
        for (let i = 0, l = hooks.length; i < l; i++) {
            const hook = hooks[i];
            const type = hook[0];

            if (type !== HOOK_TYPE_USE_EFFECT) continue;

            const dirty = hook[3];
            if (!dirty) continue;

            const callback = hook[1];
            const unsubscribe = hook[4];

            if (unsubscribe) unsubscribe();
            const unsubscribeNext = callback() || null;
            hook[4] = unsubscribeNext;
        }

        if (this.isMounted) {
            if (options.afterUpdate) {
                options.afterUpdate(this);
            }
        } else {
            this.isMounted = true;
            if (options.afterMount) {
                options.afterMount(this);
            }
        }
    },

    setState(hookIndex, valueNext) {
        const value = this.state[hookIndex];
        if (shallowEqualsScalar(value, valueNext)) {
            return;
        }
        this.state[hookIndex] = valueNext;
        this.enqueueComponent();
    },

    enqueueComponent() {
        if (currentComponent) {
            throw new Error('Cannot compose multiple components at a time');
        }
        currentComponent = this;
        this.hooksPointer = -1;
        this.data = this.componentFn(this.props) || {};
        currentComponent = null;

        if (this.el) {
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
        for (let i = 0, l = hooks.length; i < l; i++) {
            const hook = hooks[i];
            const type = hook[0];
            if (type !== HOOK_TYPE_USE_EFFECT) continue;

            const unsubscribe = hook[4];
            if (unsubscribe) unsubscribe();
        }
        this.hooks = undefined;
    },
});

const createComponentConstructor = (Parent, parentComponentFn) => {
    function ChildComponent(el, componentFn) {
        if (!this || !(this instanceof ChildComponent)) {
            const EnhancedChild = createComponentConstructor(
                ChildComponent,
                parentComponentFn
            );
            return EnhancedChild;
        }
        Parent.call(this, el, componentFn || parentComponentFn);
    }
    ChildComponent.prototype = Object.create(Parent.prototype, {
        constructor: { value: ChildComponent },
    });
    return ChildComponent;
};

export const createHookComponent = (templateFnOrObj, componentFn) => {
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
