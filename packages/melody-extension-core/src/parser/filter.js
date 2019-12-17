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
import { FilterBlockStatement } from './../types';

export const FilterParser = {
    name: 'filter',
    parse(parser, token) {
        const tokens = parser.tokens,
            ref = createNode(Identifier, token, 'filter'),
            filterExpression = parser.matchFilterExpression(ref);
        tokens.expect(Types.TAG_END);
        const openingTagEndToken = tokens.la(-1);
        let closingTagStartToken;

        const body = parser.parse((text, token, tokens) => {
            const result =
                token.type === Types.TAG_START &&
                tokens.nextIf(Types.SYMBOL, 'endfilter');

            if (result) {
                closingTagStartToken = token;
            }
            return result;
        }).expressions;

        const filterBlockStatement = new FilterBlockStatement(
            filterExpression,
            body
        );
        setStartFromToken(filterBlockStatement, token);
        setEndFromToken(filterBlockStatement, tokens.expect(Types.TAG_END));

        filterBlockStatement.trimRightFilter = hasTagEndTokenTrimRight(
            openingTagEndToken
        );
        filterBlockStatement.trimLeftEndfilter =
            closingTagStartToken &&
            hasTagStartTokenTrimLeft(closingTagStartToken);

        return filterBlockStatement;
    },
};
