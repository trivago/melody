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
import { ForStatement } from './../types';

export const ForParser = {
    name: 'for',
    parse(parser, token) {
        const tokens = parser.tokens,
            forStatement = new ForStatement();

        const keyTarget = tokens.expect(Types.SYMBOL);
        if (tokens.nextIf(Types.COMMA)) {
            forStatement.keyTarget = createNode(
                Identifier,
                keyTarget,
                keyTarget.text
            );
            const valueTarget = tokens.expect(Types.SYMBOL);
            forStatement.valueTarget = createNode(
                Identifier,
                valueTarget,
                valueTarget.text
            );
        } else {
            forStatement.keyTarget = null;
            forStatement.valueTarget = createNode(
                Identifier,
                keyTarget,
                keyTarget.text
            );
        }

        tokens.expect(Types.OPERATOR, 'in');

        forStatement.sequence = parser.matchExpression();

        if (tokens.nextIf(Types.SYMBOL, 'if')) {
            forStatement.condition = parser.matchExpression();
        }

        tokens.expect(Types.TAG_END);

        const openingTagEndToken = tokens.la(-1);
        let elseTagStartToken, elseTagEndToken;

        forStatement.body = parser.parse((tokenText, token, tokens) => {
            const result =
                token.type === Types.TAG_START &&
                (tokens.test(Types.SYMBOL, 'else') ||
                    tokens.test(Types.SYMBOL, 'endfor'));
            if (result && tokens.test(Types.SYMBOL, 'else')) {
                elseTagStartToken = token;
            }
            return result;
        });

        if (tokens.nextIf(Types.SYMBOL, 'else')) {
            tokens.expect(Types.TAG_END);
            elseTagEndToken = tokens.la(-1);
            forStatement.otherwise = parser.parse(
                (tokenText, token, tokens) => {
                    return (
                        token.type === Types.TAG_START &&
                        tokens.test(Types.SYMBOL, 'endfor')
                    );
                }
            );
        }
        const endforTagStartToken = tokens.la(-1);
        tokens.expect(Types.SYMBOL, 'endfor');

        setStartFromToken(forStatement, token);
        setEndFromToken(forStatement, tokens.expect(Types.TAG_END));

        forStatement.trimRightFor = hasTagEndTokenTrimRight(openingTagEndToken);
        forStatement.trimLeftElse = !!(
            elseTagStartToken && hasTagStartTokenTrimLeft(elseTagStartToken)
        );
        forStatement.trimRightElse = !!(
            elseTagEndToken && hasTagEndTokenTrimRight(elseTagEndToken)
        );
        forStatement.trimLeftEndfor = hasTagStartTokenTrimLeft(
            endforTagStartToken
        );

        return forStatement;
    },
};
