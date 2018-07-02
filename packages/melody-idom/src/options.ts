/**
 * Copyright 2015 The Incremental DOM Authors.
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
/** Global options
 *	@public
 *	@namespace options {Object}
 */
export type Options = {
    /** Hook invoked after a component is mounted. */
    afterMount?: (component) => void;
    /** Hook invoked after the DOM is updated with a component's latest render. */
    afterUpdate?: (component) => void;
    /** Hook invoked immediately before a component is unmounted. */
    beforeUnmount?: (component) => void;
    /** Test synchronous loading of child components */
    experimentalSyncDeepRendering?: boolean;
};

const options: Options = {};

export default options;
