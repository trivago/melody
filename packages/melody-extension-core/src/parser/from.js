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
import { ImportDeclaration, FromStatement } from './../types';

export const FromParser = {
    name: 'from',
    parse(parser, token) {
        const tokens = parser.tokens,
            source = parser.matchExpression(),
            imports = [];

        tokens.expect(Types.SYMBOL, 'import');

        do {
            const name = tokens.expect(Types.SYMBOL);

            let alias = name;
            if (tokens.nextIf(Types.SYMBOL, 'as')) {
                alias = tokens.expect(Types.SYMBOL);
            }

            const importDeclaration = new ImportDeclaration(
                createNode(Identifier, name, name.text),
                createNode(Identifier, alias, alias.text)
            );
            setStartFromToken(importDeclaration, name);
            setEndFromToken(importDeclaration, alias);

            imports.push(importDeclaration);

            if (!tokens.nextIf(Types.COMMA)) {
                break;
            }
        } while (!tokens.test(Types.EOF));

        const fromStatement = new FromStatement(source, imports);

        setStartFromToken(fromStatement, token);
        setEndFromToken(fromStatement, tokens.expect(Types.TAG_END));

        return fromStatement;
    },
};
