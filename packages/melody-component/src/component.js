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
import type { Reducer, Action, Template } from './index.js.flow';

import { mixin } from './mixin';
import { createState } from './state';
import { setProps, RECEIVE_PROPS } from './actions';
import shallowEquals from './shallowEquals';
import { enqueueComponent, options } from 'melody-idom';

// type ComponentImpl = {
//   /**
//    * The element associated with this component.
//    */
//   el: Node,
//   /**
//    * A map of references to native HTML elements.
//    */
//   refs: { [key: string]: Element },

//   /**
//    * Set new properties for the Component.
//    * This might cause the component to request an update.
//    */
//   apply(props: any): void,
//   /**
//    * Executed after a component has been mounted or updated.
//    * After this method has been triggered, the component is considered stable and
//    * accessing its own DOM should be safe.
//    * The children of this Component might not have rendered.
//    */
//   notify(): void,
//   /**
//    * Invoked when a component should render itself.
//    */
//   render(): void
// };

function Component(element: Element, reducer: Reducer) {
    // part of the public API
    this.el = element;
    this.refs = Object.create(null);
    // needed for this type of component
    this.props = null;
    this.oldProps = null;
    this.oldState = null;
    this['MELODY/STORE'] = createState(reducer);
    this.isMounted = false;
    this.dispatch = this.dispatch.bind(this);
    this.getState = this.getState.bind(this);
    this.state = this.getState();
    this.componentDidInitialize();
    this.componentWillMount();
}
Object.assign(Component.prototype, {
    /**
   * Set new properties for the Component.
   * This might cause the component to request an update.
   */
    apply(props) {
        if (!this.oldProps) {
            this.oldProps = this.props;
        }
        this.dispatch(setProps(props, this));
    },

    /**
   * Executed after a component has been mounted or updated.
   * After this method has been triggered, the component is considered stable and
   * accessing the DOM should be safe.
   * The children of this Component might not have been rendered.
   */
    notify() {
        if (this.isMounted) {
            this.componentDidUpdate(
                this.oldProps || this.props,
                this.oldState || this.state
            );
            if (options.afterUpdate) {
                options.afterUpdate(this);
            }
        } else {
            this.isMounted = true;
            this.componentDidMount();
            if (options.afterMount) {
                options.afterMount(this);
            }
        }
        this.oldProps = null;
        this.oldState = null;
    },

    dispatch(action: Action) {
        const newState = this['MELODY/STORE'](action);
        let newProps = this.props;
        const isReceiveProps = action.type === RECEIVE_PROPS;
        if (isReceiveProps) {
            newProps = action.payload;
        }
        const shouldUpdate =
            (isReceiveProps && !this.isMounted) ||
            (this.el && this.shouldComponentUpdate(newProps, newState));
        if (shouldUpdate && this.isMounted) {
            this.componentWillUpdate(newProps, newState);
        }
        if (isReceiveProps) {
            this.props = newProps;
        }
        if (shouldUpdate) {
            enqueueComponent(this);
        }
        return newState || this.state;
    },

    getState() {
        return this['MELODY/STORE']();
    },

    shouldComponentUpdate(nextProps: Object, nextState: Object) {
        return !shallowEquals(this.state, nextState);
    },

    /**
   * Invoked when a component should render itself.
   */
    render() {},
    componentDidInitialize() {},
    componentWillMount() {},
    componentDidMount() {},
    componentWillUpdate() {},
    componentDidUpdate(prevProps: Object, prevState: Object) {},
    /**
   * Invoked before a component is unmounted.
   */
    componentWillUnmount() {},
});

function mapPropsToState(state, action) {
    return action.type === RECEIVE_PROPS ? action.payload : state || {};
}

function createComponentConstructor(Parent, parentReducer) {
    function ChildComponent(el, reducer: ?Reducer) {
        if (!this || !(this instanceof ChildComponent)) {
            const EnhancedChild = createComponentConstructor(
                ChildComponent,
                parentReducer
            );
            for (let i = 0, len = arguments.length; i < len; i++) {
                mixin(EnhancedChild, arguments[i]);
            }
            return EnhancedChild;
        }
        Parent.call(this, el, reducer || parentReducer);
    }
    ChildComponent.prototype = Object.create(Parent.prototype, {
        constructor: { value: ChildComponent },
    });
    return ChildComponent;
}

export function createComponent(
    templateFnOrObj: Template,
    reducer: ?Reducer
): Component {
    const template = templateFnOrObj.render
        ? props => templateFnOrObj.render(props)
        : templateFnOrObj;
    const finalReducer = reducer || mapPropsToState;
    const ChildComponent = createComponentConstructor(Component, finalReducer);
    ChildComponent.prototype.displayName =
        template.name || template.displayName || 'Unknown';
    ChildComponent.prototype.render = function() {
        this.oldState = this.state;
        this.state = this.getState();
        return template(this.state);
    };
    for (let i = 2, len = arguments.length; i < len; i++) {
        mixin(ChildComponent, arguments[i]);
    }
    return ChildComponent;
}
