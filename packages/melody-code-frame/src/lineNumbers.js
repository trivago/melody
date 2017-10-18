// Copyright 2014, 2015 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)
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
import { padStart } from 'lodash';

const get = options => (key, defaultValue) =>
    key in options ? options[key] : defaultValue;

function lineNumbers(lines, options) {
    const getOption = get(options);
    const transform = getOption('transform', Function.prototype);
    const padding = getOption('padding', ' ');
    const before = getOption('before', ' ');
    const after = getOption('after', ' | ');
    const start = getOption('start', 1);
    const end = start + lines.length - 1;
    const width = String(end).length;
    return lines.map(function(line, index) {
        const number = start + index;
        const params = { before, number, width, after, line };
        transform(params);
        return (
            params.before +
            padStart(params.number, width, padding) +
            params.after +
            params.line
        );
    });
}

export default lineNumbers;
