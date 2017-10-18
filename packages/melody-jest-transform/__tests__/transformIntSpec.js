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
import './__fixtures__/block.twig';
import './__fixtures__/embed_nested.twig';
import './__fixtures__/expressions.twig';
import './__fixtures__/extends.twig';
import './__fixtures__/extends_with_context.twig';
import './__fixtures__/for_if_else.twig';
import './__fixtures__/for_local.twig';
import './__fixtures__/for_with_block.twig';
import './__fixtures__/for_with_block_and_key.twig';
import './__fixtures__/for_with_include.twig';
import './__fixtures__/itemElement.twig';
import './__fixtures__/macros.twig';
import './__fixtures__/mount.twig';
import './__fixtures__/multi_include.twig';
import './__fixtures__/raw.twig';
import './__fixtures__/ref.twig';
import './__fixtures__/set.twig';
import './__fixtures__/spaceless.twig';
import './__fixtures__/svg.twig';

describe('Transform', () => {
    it('should successfully transform compiler templates', () => {
        /*
     * If this starts it means your twig templates are compiled correctly
     * by melody-jest-transform since it is preprocessed by jest
     */

        expect(true).toBe(true);
    });
});
