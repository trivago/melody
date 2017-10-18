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
import { extension as CoreExtension } from 'melody-extension-core';
import idomPlugin from 'melody-plugin-idom';
import { transformer, process } from '../src';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('find-babel-config', () => ({
    sync: jest.fn().mockImplementation(path => ({
        config: {
            env: {
                test: {
                    presets: ['node6', 'stage-1'],
                    plugins: ['transform-inline-environment-variables'],
                },
            },
        },
    })),
}));

describe('Custom transformer', () => {
    const getFixture = twigPath => {
        const fixturePrefix = './__fixtures__/';
        const filePath = path.join(__dirname, fixturePrefix, twigPath);

        return fs.readFileSync(filePath).toString();
    };

    const test = (fixtureName, options, processFn) => {
        const fixture = getFixture(fixtureName);
        const result = processFn
            ? process(fixture, fixtureName)
            : transformer(fixture, fixtureName, options);
        expect(result).toMatchSnapshot();
    };

    it('should work with default babelconfig and melody-plugins', () => {
        test('test.twig');
    });

    it('should work with custom babelConfig and melody-plugins', () => {
        const plugins = [
            idomPlugin,
            {
                ...CoreExtension,
                options: {
                    svgFilePath: 'testFilePath',
                    embedSvgAsMelody: true,
                },
            },
        ];
    });

    it('should throw error if it cannot find a config in regular locations', () => {
        const mockedFindBabel = require('find-babel-config');
        mockedFindBabel.sync.mockImplementationOnce(() => false);
        const regularFixture = getFixture('test.twig');
        expect(() =>
            transformer(regularFixture, 'test.twig'),
        ).toThrowErrorMatchingSnapshot();
    });

    it('should return compiled melody code when noBabel set', () => {
        test('test.twig', { noBabel: true });
    });

    it("should transpile with jest's process function", () => {
        // eslint-disable-line quotes
        test('test.twig', {}, true);
    });
});
