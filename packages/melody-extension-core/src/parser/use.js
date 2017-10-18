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
    copyStart,
    copyEnd,
    createNode,
} from 'melody-parser';
import { AliasExpression, UseStatement } from './../types';

export const UseParser = {
    name: 'use',
    parse(parser, token) {
        const tokens = parser.tokens;

        const source = parser.matchExpression(),
            aliases = [];

        if (tokens.nextIf(Types.SYMBOL, 'with')) {
            do {
                const nameToken = tokens.expect(Types.SYMBOL),
                    name = createNode(Identifier, nameToken, nameToken.text);
                let alias = name;
                if (tokens.nextIf(Types.SYMBOL, 'as')) {
                    const aliasToken = tokens.expect(Types.SYMBOL);
                    alias = createNode(Identifier, aliasToken, aliasToken.text);
                }
                const aliasExpression = new AliasExpression(name, alias);
                copyStart(aliasExpression, name);
                copyEnd(aliasExpression, alias);
                aliases.push(aliasExpression);
            } while (tokens.nextIf(Types.COMMA));
        }

        const useStatement = new UseStatement(source, aliases);

        setStartFromToken(useStatement, token);
        setEndFromToken(useStatement, tokens.expect(Types.TAG_END));

        return useStatement;
    },
};
