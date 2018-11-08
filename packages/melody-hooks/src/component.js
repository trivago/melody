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
import { HOOK_TYPE_USE_EFFECT, HOOK_TYPE_USE_REF } from './constants';
import { setCurrentComponent, unsetCurrentComponent } from './util/hooks';

const defaultComponentFn = props => props;

function Component(element, componentFn) {
    // part of the public API
    this.el = element;

    // needed for this type of component
    this.componentFn = componentFn ? componentFn : defaultComponentFn;
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

            switch (type) {
                case HOOK_TYPE_USE_EFFECT: {
                    const dirty = hook[3];
                    if (!dirty) continue;

                    const callback = hook[1];
                    const unsubscribe = hook[4];

                    if (unsubscribe) unsubscribe();
                    const unsubscribeNext = callback() || null;
                    hook[4] = unsubscribeNext;
                    break;
                }
                default: {
                    continue;
                }
            }
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
        setCurrentComponent(this);
        this.hooksPointer = -1;
        this.data = this.componentFn(this.props) || {};
        unsetCurrentComponent();

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
            switch (type) {
                case HOOK_TYPE_USE_EFFECT: {
                    const unsubscribe = hook[4];
                    if (unsubscribe) unsubscribe();
                    break;
                }
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
