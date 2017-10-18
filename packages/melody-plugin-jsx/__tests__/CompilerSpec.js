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
import { compile, toString } from 'melody-compiler';
import { extension as coreExtension } from 'melody-extension-core';
import jsxPlugin from '../src';
import fs from 'fs';
import path from 'path';

describe('Compiler', function() {
    getFixtures('success').forEach(({ name, twigPath }) => {
        it('should correctly transform ' + name.replace(/_/g, ' '), function() {
            fixture(twigPath, name);
        });
    });

    getFixtures('error').forEach(({ name, twigPath }) => {
        it('should fail transforming ' + name.replace(/_/g, ' '), function() {
            expect(
                fixture.bind(null, twigPath, name),
            ).toThrowErrorMatchingSnapshot();
        });
    });
});

function getFixtures(type) {
    const dirPath = path.join(__dirname, '__fixtures__', type);
    return fs.readdirSync(dirPath).map(name => ({
        name: path.basename(name, '.twig'),
        twigPath: path.join(dirPath, name),
    }));
}

function fixture(twigPath, name) {
    const twig = fs.readFileSync(twigPath).toString();

    const jsAst = compile(name + '.twig', twig, coreExtension, jsxPlugin);
    const actual = toString(jsAst, twig).code;

    expect(`\n${actual}\n`).toMatchSnapshot();
}
