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
/**
  * Accepts a function that maps owner props to a new collection of props that are passed to the base component.
  */
const mapProps = mapper => Component =>
    Component(({ apply }) => ({
        apply(props) {
            if (props !== this.props) {
                apply.call(this, mapper(props));
            }
        },
    }));

export default mapProps;
