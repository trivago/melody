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
import { assert } from 'chai';
import { isEmpty, inheritBlocks } from '../src/helpers';

describe('Runtime/Helpers', function() {
    describe('isEmpty', function() {
        it('should return true for an empty array', function() {
            assert.equal(isEmpty([]), true);
        });

        it('should return false for a non-empty array', function() {
            assert.equal(isEmpty([42]), false);
        });

        it('should return true for null', function() {
            assert.equal(isEmpty(null), true);
        });

        it('should return true for undefined', function() {
            assert.equal(isEmpty(undefined), true);
        });

        it('should return false for an empty object', function() {
            assert.equal(isEmpty({}), false);
        });

        it('should return false for 0', function() {
            assert.equal(isEmpty(0), false);
        });
    });

    describe('inheritBlocks', function() {
        it('copies block rendering methods', function() {
            const template = { render: 1 };
            const used = { renderFoo: 2, render: 3 };
            inheritBlocks(template, used);
            assert.equal(template.renderFoo, 2);
            assert.equal(template.render, 1);
        });

        it('copies block rendering methods with mappings', function() {
            const template = { render: 1 };
            const used = { renderFoo: 2, render: 3, renderFoobar: 4 };
            const mapping = { renderFoo: 'renderBar' };
            inheritBlocks(template, used, mapping);
            assert.equal(template.renderFoo, undefined);
            assert.equal(template.renderFoobar, undefined);
            assert.equal(template.renderBar, 2);
            assert.equal(template.render, 1);
        });

        it('ignores prototype methods', function() {
            const bak = Object.prototype.fooBar;
            Object.prototype.fooBar = 1;

            const template = Object.create(null);
            const used = { renderFoo: 2, render: 3 };
            inheritBlocks(template, used);

            assert.equal(template.renderFoo, 2);
            assert.equal(template.fooBar, undefined);

            Object.prototype.fooBar = bak;
        });
    });
});
