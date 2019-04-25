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

import { enqueueComponent } from 'melody-idom';
import { shallowEqual } from './util/shallowEqual';
import { combine } from './operators/combine';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import {
    distinctUntilChanged,
    tap,
    take,
    ignoreElements,
} from 'rxjs/operators';

const warningTimer = timer(500).pipe(
    tap(() => {
        /* eslint-disable no-console */
        console.warn(
            'Warning: Your Component did not emit any state updates for at least 500ms.'
        );
        /* eslint-enable no-console */
    }),
    take(1),
    ignoreElements()
);

function Component(element) {
    // part of the public API
    this.el = element;
    this.refs = {};
    this.props = {};
    this.propsStream = new BehaviorSubject({});
    this.updates = new Subject();
    this.subscriptions = [];
    this.state = {};
}

Object.assign(Component.prototype, {
    type: 'streaming',
    apply(props) {
        this.propsStream.next(props);
        if (this.subscriptions.length === 0) {
            const t = this.getTransform({
                dispatchCustomEvent: (eventName, detail, options = {}) => {
                    const event = new CustomEvent(eventName, {
                        ...options,
                        detail,
                    });
                    this.el.dispatchEvent(event);
                },
                props: this.propsStream,
                updates: this.updates,
                subscribe: obs => this.subscriptions.push(obs.subscribe()),
            });
            const warningSubscription = warningTimer.subscribe();
            const s = t.pipe(distinctUntilChanged(shallowEqual)).subscribe(
                state => {
                    if (!warningSubscription.closed)
                        warningSubscription.unsubscribe();
                    this.state = state;
                    enqueueComponent(this);
                },
                err => {
                    if (process.env.NODE_ENV !== 'production') {
                        /* eslint-disable no-console */
                        console.error('Error: ', err);
                        /* eslint-enable no-console */
                    }
                }
            );

            this.subscriptions.push(s);
        }
    },

    notify() {
        this.updates.next();
    },

    componentWillUnmount() {
        this.propsStream.complete();
        this.updates.complete();
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions.length = 0;
    },

    render() {},
});

const createComponentConstructor = Parent => {
    function ChildComponent(el) {
        Parent.call(this, el);
    }
    ChildComponent.prototype = Object.create(Parent.prototype, {
        constructor: { value: ChildComponent },
    });
    return ChildComponent;
};

export const baseCreateComponent = (transform, templateFnOrObj) => {
    const template = templateFnOrObj.render
        ? props => templateFnOrObj.render(props)
        : templateFnOrObj;
    const ChildComponent = createComponentConstructor(Component);
    ChildComponent.prototype.displayName =
        transform.name || template.name || template.displayName || 'Unknown';
    ChildComponent.prototype.render = function() {
        return template(this.state);
    };
    ChildComponent.prototype.getTransform = api => combine(transform(api));
    return ChildComponent;
};

export const createComponent = (...args) => {
    if (args.length >= baseCreateComponent.length) {
        return baseCreateComponent.apply(null, args);
    }
    return (...args2) => createComponent.apply(null, args.concat(args2));
};
