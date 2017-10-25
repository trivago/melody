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
import { Identifier } from 'melody-types';
import {
    Types,
    setStartFromToken,
    setEndFromToken,
    createNode,
} from 'melody-parser';
import { ImportDeclaration } from './../types';

export const ImportParser = {
    name: 'import',
    parse(parser, token) {
        const tokens = parser.tokens,
            source = parser.matchExpression();

        tokens.expect(Types.SYMBOL, 'as');
        const alias = tokens.expect(Types.SYMBOL);

        const importStatement = new ImportDeclaration(
            source,
            createNode(Identifier, alias, alias.text)
        );

        setStartFromToken(importStatement, token);
        setEndFromToken(importStatement, tokens.expect(Types.TAG_END));

        return importStatement;
    },
};
