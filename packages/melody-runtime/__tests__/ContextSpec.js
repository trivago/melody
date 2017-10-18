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
import { expect } from 'chai';

import { createSubContext } from '../src';

describe('createSubContext', function() {
    let context = null;
    beforeEach(function() {
        context = {
            a: 2,
            b: 42,
        };
    });

    afterEach(function() {
        context = null;
    });

    it('returns a new sub context', function() {
        const subContext = createSubContext(context);
        expect(subContext === context).to.be.false;
    });

    it('provides access to the parent context properties', function() {
        const subContext = createSubContext(context);
        expect(subContext.b).to.equal(42);
    });

    it('enhances the child context with new properties', function() {
        const subContext = createSubContext(context, { c: 1 });
        expect(subContext.b).to.equal(42);
        expect(subContext.c).to.equal(1);
        expect(context.c).to.be.undefined;
    });
});
