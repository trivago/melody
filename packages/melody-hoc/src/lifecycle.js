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
const createScope = component => ({
    get el() {
        return component.el;
    },
    get refs() {
        return component.refs;
    },
    get props() {
        return component.props;
    },
    get state() {
        return component.state;
    },
    dispatch(action) {
        return component.dispatch(action);
    },
    getState() {
        return component.getState();
    },
});

export default function lifecycle(def = {}) {
    return component =>
        component(proto => {
            const scope = Symbol();
            const {
                componentDidInitialize,
                componentWillMount,
                componentDidMount,
                componentWillUpdate,
                componentDidUpdate,
                componentWillUnmount,
            } = proto;

            return {
                componentDidInitialize() {
                    componentDidInitialize.call(this);
                    this[scope] = createScope(this);
                    if (def.componentDidInitialize) {
                        def.componentDidInitialize.call(this[scope]);
                    }
                },
                componentWillMount() {
                    componentWillMount.call(this);
                    if (def.componentWillMount) {
                        def.componentWillMount.call(this[scope]);
                    }
                },
                componentDidMount() {
                    componentDidMount.call(this);
                    if (def.componentDidMount) {
                        def.componentDidMount.call(this[scope]);
                    }
                },
                componentWillUpdate(newProps, newState) {
                    componentWillUpdate.call(this, newProps, newState);
                    if (def.componentWillUpdate) {
                        def.componentWillUpdate.call(
                            this[scope],
                            newProps,
                            newState
                        );
                    }
                },
                componentDidUpdate(prevProps, prevState) {
                    componentDidUpdate.call(this, prevProps, prevState);
                    if (def.componentDidUpdate) {
                        def.componentDidUpdate.call(
                            this[scope],
                            prevProps,
                            prevState
                        );
                    }
                },
                componentWillUnmount() {
                    componentWillUnmount.call(this);
                    if (def.componentWillUnmount) {
                        def.componentWillUnmount.call(this[scope]);
                    }
                    this[scope] = undefined;
                },
            };
        });
}
