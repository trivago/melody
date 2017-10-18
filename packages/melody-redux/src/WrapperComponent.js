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
import { link } from 'melody-idom';

const createWrapperComponent = Component =>
    class WrapperComponent {
        constructor() {
            this.refs = Object.create(null);
            this.props = null;
            this.childInstance = new Component();
            link(this, this.childInstance);
        }

        set el(el) {
            this.childInstance.el = el;
            return el;
        }

        get el() {
            return this.childInstance.el;
        }
    };

export { createWrapperComponent };
