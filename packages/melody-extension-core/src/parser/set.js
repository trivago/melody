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
    hasTagStartTokenTrimLeft,
    hasTagEndTokenTrimRight,
} from 'melody-parser';
import { VariableDeclarationStatement, SetStatement } from './../types';

export const SetParser = {
    name: 'set',
    parse(parser, token) {
        const tokens = parser.tokens,
            names = [],
            values = [];

        let openingTagEndToken, closingTagStartToken;

        do {
            const name = tokens.expect(Types.SYMBOL);
            names.push(createNode(Identifier, name, name.text));
        } while (tokens.nextIf(Types.COMMA));

        if (tokens.nextIf(Types.ASSIGNMENT)) {
            do {
                values.push(parser.matchExpression());
            } while (tokens.nextIf(Types.COMMA));
        } else {
            if (names.length !== 1) {
                parser.error({
                    title: 'Illegal multi-set',
                    pos: tokens.la(0).pos,
                    advice:
                        'When using set with a block, you cannot have multiple targets.',
                });
            }
            tokens.expect(Types.TAG_END);
            openingTagEndToken = tokens.la(-1);

            values[0] = parser.parse((tokenText, token, tokens) => {
                const result = !!(
                    token.type === Types.TAG_START &&
                    tokens.nextIf(Types.SYMBOL, 'endset')
                );
                if (result) {
                    closingTagStartToken = token;
                }
                return result;
            }).expressions;
        }

        if (names.length !== values.length) {
            parser.error({
                title: 'Mismatch of set names and values',
                pos: token.pos,
                advice: `When using set, you must ensure that the number of
assigned variable names is identical to the supplied values. However, here I've found
${names.length} variable names and ${values.length} values.`,
            });
        }

        // now join names and values
        const assignments = [];
        for (let i = 0, len = names.length; i < len; i++) {
            assignments[i] = new VariableDeclarationStatement(
                names[i],
                values[i]
            );
        }

        const setStatement = new SetStatement(assignments);

        setStartFromToken(setStatement, token);
        setEndFromToken(setStatement, tokens.expect(Types.TAG_END));

        setStatement.trimRightSet = !!(
            openingTagEndToken && hasTagEndTokenTrimRight(openingTagEndToken)
        );
        setStatement.trimLeftEndset = !!(
            closingTagStartToken &&
            hasTagStartTokenTrimLeft(closingTagStartToken)
        );

        return setStatement;
    },
};
