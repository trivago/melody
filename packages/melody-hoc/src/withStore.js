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
import { RECEIVE_PROPS } from 'melody-component';

const UNSUB = 'MELODY/WITH_STORE/UNSUB';
const IS_FIRST_APPLY = 'MELODY/WITH_STORE/FIRST_APPLY';
const STORE = 'MELODY/WITH_STORE/STORE';

const withStore = (
    storeFactory,
    stateName = 'state',
    dispatchName = 'dispatch'
) => Component => {
    return class WithStoreComponent extends Component {
        constructor(...args) {
            super(...args);
            this[STORE] = storeFactory();
            this[IS_FIRST_APPLY] = true;
        }

        apply(props) {
            if (props === this.props) {
                return;
            }

            this[STORE].dispatch({
                type: RECEIVE_PROPS,
                payload: props,
            });

            if (this[IS_FIRST_APPLY]) {
                this[UNSUB] = this[STORE].subscribe(() => {
                    super.apply({
                        ...this.props,
                        [stateName]: this[STORE].getState(),
                        [dispatchName]: this[STORE].dispatch,
                    });
                });
                this[IS_FIRST_APPLY] = false;
            }

            super.apply({
                ...props,
                [stateName]: this[STORE].getState(),
                [dispatchName]: this[STORE].dispatch,
            });
        }

        componentWillUnmount() {
            this[UNSUB]();
        }
    };
};

export default withStore;
export { RECEIVE_PROPS } from 'melody-component';
