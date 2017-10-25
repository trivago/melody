/**
 * Copyright (c) 2015-2016 Andrew Clark
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
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
const mapValues = (obj, func) => {
    const result = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = func(obj[key], key);
        }
    }
    return result;
};

const CACHED_HANDLERS = 'MELODY/WITH_HANDLERS/CACHED_HANDLERS';
const HANDLERS = 'MELODY/WITH_HANDLERS/HANDLERS';

const withHandlers = handlers => Component => {
    return class WithHandlersComponent extends Component {
        constructor(...args) {
            super(...args);
            this[CACHED_HANDLERS] = {};
            this[HANDLERS] = mapValues(
                handlers,
                (createHandler, handlerName) => (...args) => {
                    const cachedHandler = this[CACHED_HANDLERS][handlerName];
                    if (cachedHandler) {
                        return cachedHandler(...args);
                    }

                    const handler = createHandler(this.props);
                    this[CACHED_HANDLERS][handlerName] = handler;

                    if (
                        process.env.NODE_ENV !== 'production' &&
                        typeof handler !== 'function'
                    ) {
                        // eslint-disable-next-line no-console
                        console.error(
                            'withHandlers(): Expected a map of higher-order functions. ' +
                                'Refer to the docs for more info.'
                        );
                    }

                    return handler(...args);
                }
            );
        }

        apply(props) {
            if (props === this.props) {
                return;
            }

            this[CACHED_HANDLERS] = {};

            super.apply({
                ...props,
                ...this[HANDLERS],
            });
        }
    };
};

export default withHandlers;
