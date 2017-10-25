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
import { Types, setStartFromToken, setEndFromToken } from 'melody-parser';
import { IfStatement } from './../types';

export const IfParser = {
    name: 'if',
    parse(parser, token) {
        const tokens = parser.tokens;
        let test = parser.matchExpression(),
            alternate = null;

        tokens.expect(Types.TAG_END);

        const ifStatement = new IfStatement(
            test,
            parser.parse(matchConsequent).expressions
        );

        do {
            if (tokens.nextIf(Types.SYMBOL, 'else')) {
                tokens.expect(Types.TAG_END);
                (alternate || ifStatement).alternate = parser.parse(
                    matchAlternate
                ).expressions;
            } else if (tokens.nextIf(Types.SYMBOL, 'elseif')) {
                test = parser.matchExpression();
                tokens.expect(Types.TAG_END);
                const consequent = parser.parse(matchConsequent).expressions;
                alternate = (alternate || ifStatement
                ).alternate = new IfStatement(test, consequent);
            }

            if (tokens.nextIf(Types.SYMBOL, 'endif')) {
                break;
            }
        } while (!tokens.test(Types.EOF));

        setStartFromToken(ifStatement, token);
        setEndFromToken(ifStatement, tokens.expect(Types.TAG_END));

        return ifStatement;
    },
};

function matchConsequent(tokenText, token, tokens) {
    if (token.type === Types.TAG_START) {
        const next = tokens.la(0).text;
        return next === 'else' || next === 'endif' || next === 'elseif';
    }
    return false;
}

function matchAlternate(tokenText, token, tokens) {
    return token.type === Types.TAG_START && tokens.test(Types.SYMBOL, 'endif');
}
