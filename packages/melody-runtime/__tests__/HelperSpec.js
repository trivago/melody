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
import { isEmpty, inheritBlocks } from '../src/helpers';

describe('Runtime/Helpers', function() {
    describe('isEmpty', function() {
        it('should return true for an empty array', function() {
            expect(isEmpty([])).toBeTruthy();
        });

        it('should return false for a non-empty array', function() {
            expect(isEmpty([42])).toBeFalsy();
        });

        it('should return true for null', function() {
            expect(isEmpty(null)).toBeTruthy();
        });

        it('should return true for undefined', function() {
            expect(isEmpty(undefined)).toBeTruthy();
        });

        it('should return false for an empty object', function() {
            expect(isEmpty({})).toBeFalsy();
        });

        it('should return false for 0', function() {
            expect(isEmpty(0)).toBeFalsy();
        });
    });

    describe('inheritBlocks', function() {
        it('copies block rendering methods', function() {
            const template = { render: 1 };
            const used = { renderFoo: 2, render: 3 };
            inheritBlocks(template, used);
            expect(template.renderFoo).toEqual(2);
            expect(template.render).toEqual(1);
        });

        it('copies block rendering methods with mappings', function() {
            const template = { render: 1 };
            const used = { renderFoo: 2, render: 3, renderFoobar: 4 };
            const mapping = { renderFoo: 'renderBar' };
            inheritBlocks(template, used, mapping);
            expect(template.renderFoo).toBeUndefined();
            expect(template.renderFoobar).toBeUndefined();
            expect(template.renderBar).toEqual(2);
            expect(template.render).toEqual(1);
        });

        it('ignores prototype methods', function() {
            const bak = Object.prototype.fooBar;
            Object.prototype.fooBar = 1;

            const template = Object.create(null);
            const used = { renderFoo: 2, render: 3 };
            inheritBlocks(template, used);

            expect(template.renderFoo).toEqual(2);
            expect(template.fooBar).toBeUndefined();

            Object.prototype.fooBar = bak;
        });
    });
});
