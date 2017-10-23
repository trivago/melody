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
import type { ReduxStore, Action } from 'melody-component';
import type { Component } from 'melody-component/component';
import { getParent } from 'melody-idom';
import { createWrapperComponent } from './WrapperComponent';

export type StateToPropsMapper = (state: Object, ownProps: Object) => Object;
export type DispatchToPropsMapper = (
    dispatch: (action: Action) => void
) => Object;
export type PropsMerger = (
    stateProps: Object,
    dispatchProps: Object,
    ownProps: Object
) => Object;

const findNextStore = comp => {
    for (let node = comp; node; node = getParent(node)) {
        if (node.store) {
            return node.store;
        }
    }
    return null;
};

const defaultEmptyStateToPropsMapping = {};
const defaultMapStateToProps: StateToPropsMapper = () =>
    defaultEmptyStateToPropsMapping;
const defaultMapDispatchToProps: DispatchToPropsMapper = dispatch => ({
    dispatch,
});
const defaultMergeProps: PropsMerger = (
    stateProps,
    dispatchProps,
    parentProps
) => Object.assign({}, parentProps, stateProps, dispatchProps);

export function connect(
    mapStateToProps: ?StateToPropsMapper,
    mapDispatchToProps: ?(DispatchToPropsMapper | Object),
    mergeProps: ?PropsMerger
) {
    const shouldSubscribeToStore = !!mapStateToProps;
    const doStatePropsDependOnOwnProps =
        shouldSubscribeToStore && mapStateToProps.length !== 1;
    let finalMapDispatchToProps =
        mapDispatchToProps || defaultMapDispatchToProps;
    if (mapDispatchToProps && typeof mapDispatchToProps !== 'function') {
        const dispatchMap = mapDispatchToProps;
        finalMapDispatchToProps = dispatch =>
            Object.keys(dispatchMap).reduce((acc, key) => {
                acc[key] = (...args) => dispatch(dispatchMap[key](...args));
                return acc;
            }, {});
    }
    const doDispatchPropsDependOnOwnProps =
        finalMapDispatchToProps.length !== 1;
    const finalMapStateToProps = mapStateToProps || defaultMapStateToProps;
    const finalMergeProps = mergeProps || defaultMergeProps;

    return Component =>
        class ConnectWrapperComponent extends createWrapperComponent(
            Component
        ) {
            constructor() {
                super();
                this.store = null;
                this.storeConnection = null;

                this.renderProps = null;
                this.ownProps = null;
                this.stateProps = null;
                this.dispatchProps = null;

                this.mapStateToPropsFn = finalMapStateToProps;
                this.mapDispatchToPropsFn = finalMapDispatchToProps;

                if (process.env.NODE_ENV !== 'production') {
                    this.displayName = `connect`;
                }
            }

            apply(props: Object) {
                if (shouldSubscribeToStore && !this.storeConnection) {
                    this.subscribeToStore();
                }
                if (shallowEquals(this.ownProps, props)) {
                    return;
                }
                const store = this.store || findNextStore(this);
                if (this.ownProps !== props || this.renderProps === null) {
                    this.ownProps = props;
                    if (doStatePropsDependOnOwnProps || !this.stateProps) {
                        this.stateProps = this.mapStateToProps(
                            store.getState(),
                            props
                        );
                    }

                    if (
                        doDispatchPropsDependOnOwnProps ||
                        !this.dispatchProps
                    ) {
                        this.dispatchProps = this.mapDispatchToProps(
                            store.dispatch,
                            props
                        );
                    }

                    this.renderProps = finalMergeProps(
                        this.stateProps,
                        this.dispatchProps,
                        props
                    );
                }
                this.childInstance.apply(this.renderProps);
            }

            subscribeToStore() {
                if (shouldSubscribeToStore && !this.storeConnection) {
                    if (!this.store) {
                        this.store = findNextStore(this);
                    }
                    this.storeConnection = this.store.subscribe(() => {
                        const props = this.ownProps;
                        const newStateProps = this.mapStateToProps(
                            this.store.getState(),
                            props
                        );
                        if (newStateProps !== this.stateProps) {
                            const newRenderProps = finalMergeProps(
                                newStateProps,
                                this.dispatchProps,
                                props
                            );
                            this.stateProps = newStateProps;
                            const didRenderPropsChange = !shallowEquals(
                                this.renderProps,
                                newRenderProps
                            );
                            this.renderProps = newRenderProps;
                            if (didRenderPropsChange) {
                                this.childInstance.apply(this.renderProps);
                            }
                        }
                    });
                }
            }

            mapStateToProps(state, props) {
                let result = this.mapStateToPropsFn.call(null, state, props);
                if (typeof result === 'function') {
                    this.mapStateToPropsFn = result;
                    result = this.mapStateToPropsFn.call(null, state, props);
                }
                return result;
            }

            mapDispatchToProps(dispatch, props) {
                let result = this.mapDispatchToPropsFn.call(
                    null,
                    dispatch,
                    props
                );
                if (typeof result === 'function') {
                    this.mapDispatchToPropsFn = result;
                    result = this.mapDispatchToPropsFn.call(
                        null,
                        dispatch,
                        props
                    );
                }
                return result;
            }

            componentWillUnmount() {
                if (shouldSubscribeToStore) {
                    this.storeConnection();
                    this.storeConnection = null;
                    this.store = null;
                }
                this.mapStateToPropsFn = null;
                this.mapDispatchToPropsFn = null;
            }
        };
}

export function provide(store: ReduxStore, Component: Component): Component {
    return class StoreProviderComponent extends createWrapperComponent(
        Component
    ) {
        constructor() {
            super();
            this.store = store;

            if (process.env.NODE_ENV !== 'production') {
                this.displayName = `provide`;
            }
        }

        apply(props) {
            if (!shallowEquals(props, this.props)) {
                this.childInstance.apply(props);
            }
        }

        componentWillUnmount() {}
    };
}

const hasOwn = Object.prototype.hasOwnProperty;

// based on react-redux
function shallowEquals(a, b) {
    if (a === b) {
        return true;
    }

    if (!a || !b) {
        return false;
    }

    const keyOfA = Object.keys(a),
        keysOfB = Object.keys(b);

    if (keyOfA.length !== keysOfB.length) {
        return false;
    }

    for (let i = 0; i < keyOfA.length; i++) {
        if (!hasOwn.call(b, keyOfA[i]) || a[keyOfA[i]] !== b[keyOfA[i]]) {
            return false;
        }
    }

    return true;
}
