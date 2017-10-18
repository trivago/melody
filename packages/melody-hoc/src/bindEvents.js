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
import withRefs from './withRefs';

export default function bindEvents(map) {
    return withRefs(component => {
        return Object.keys(map).reduce((acc, refName) => {
            const eventMap = map[refName];
            acc[refName] = el => {
                const unsubscribers = Object.keys(eventMap).map(eventName => {
                    const _handler = eventMap[eventName];
                    const handler = event => _handler(event, component);
                    el.addEventListener(eventName, handler, false);
                    return () =>
                        el.removeEventListener(eventName, handler, false);
                });
                return {
                    unsubscribe() {
                        unsubscribers.forEach(f => f());
                        unsubscribers.length = 0;
                    },
                };
            };
            return acc;
        }, {});
    });
}
