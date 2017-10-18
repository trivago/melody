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

export const EOF = Symbol();

export class CharStream {
    constructor(input) {
        this.input = String(input);
        this.length = this.input.length;
        this.index = 0;
        this.position = { line: 1, column: 0 };
    }

    get source() {
        return this.input;
    }

    reset() {
        this.rewind({ line: 1, column: 0, index: 0 });
    }

    mark() {
        let { line, column } = this.position,
            index = this.index;
        return { line, column, index };
    }

    rewind(marker) {
        this.position.line = marker.line;
        this.position.column = marker.column;
        this.index = marker.index;
    }

    la(offset) {
        var index = this.index + offset;
        return index < this.length ? this.input.charAt(index) : EOF;
    }

    lac(offset) {
        var index = this.index + offset;
        return index < this.length ? this.input.charCodeAt(index) : EOF;
    }

    next() {
        if (this.index === this.length) {
            return EOF;
        }
        var ch = this.input.charAt(this.index);
        this.index++;
        this.position.column++;
        if (ch === '\n') {
            this.position.line += 1;
            this.position.column = 0;
        }
        return ch;
    }

    match(str) {
        const start = this.mark();
        for (let i = 0, len = str.length; i < len; i++) {
            const ch = this.next();
            if (ch !== str.charAt(i) || ch === EOF) {
                this.rewind(start);
                return false;
            }
        }
        return true;
    }
}
