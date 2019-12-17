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
import { Node } from 'melody-types';
import {
    Types,
    setStartFromToken,
    setEndFromToken,
    hasTagStartTokenTrimLeft,
    hasTagEndTokenTrimRight,
} from 'melody-parser';
import { filter } from 'lodash';
import { EmbedStatement } from './../types';

export const EmbedParser = {
    name: 'embed',
    parse(parser, token) {
        const tokens = parser.tokens;

        const embedStatement = new EmbedStatement(parser.matchExpression());

        if (tokens.nextIf(Types.SYMBOL, 'ignore')) {
            tokens.expect(Types.SYMBOL, 'missing');
            embedStatement.ignoreMissing = true;
        }

        if (tokens.nextIf(Types.SYMBOL, 'with')) {
            embedStatement.argument = parser.matchExpression();
        }

        if (tokens.nextIf(Types.SYMBOL, 'only')) {
            embedStatement.contextFree = true;
        }

        tokens.expect(Types.TAG_END);
        const openingTagEndToken = tokens.la(-1);
        let closingTagStartToken;

        embedStatement.blocks = filter(
            parser.parse((tokenText, token, tokens) => {
                const result = !!(
                    token.type === Types.TAG_START &&
                    tokens.nextIf(Types.SYMBOL, 'endembed')
                );
                if (result) {
                    closingTagStartToken = token;
                }
                return result;
            }).expressions,
            Node.isBlockStatement
        );

        setStartFromToken(embedStatement, token);
        setEndFromToken(embedStatement, tokens.expect(Types.TAG_END));

        embedStatement.trimRightEmbed = hasTagEndTokenTrimRight(
            openingTagEndToken
        );
        embedStatement.trimLeftEndembed =
            closingTagStartToken &&
            hasTagStartTokenTrimLeft(closingTagStartToken);

        return embedStatement;
    },
};
