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
import { Identifier, PrintExpressionStatement } from 'melody-types';
import {
    Types,
    setStartFromToken,
    setEndFromToken,
    createNode,
    hasTagStartTokenTrimLeft,
    hasTagEndTokenTrimRight,
} from 'melody-parser';
import { BlockStatement } from './../types';

export const BlockParser = {
    name: 'block',
    parse(parser, token) {
        const tokens = parser.tokens,
            nameToken = tokens.expect(Types.SYMBOL);

        let blockStatement, openingTagEndToken, closingTagStartToken;
        if ((openingTagEndToken = tokens.nextIf(Types.TAG_END))) {
            blockStatement = new BlockStatement(
                createNode(Identifier, nameToken, nameToken.text),
                parser.parse((tokenText, token, tokens) => {
                    const result = !!(
                        token.type === Types.TAG_START &&
                        tokens.nextIf(Types.SYMBOL, 'endblock')
                    );
                    if (result) {
                        closingTagStartToken = token;
                    }
                    return result;
                }).expressions
            );

            if (tokens.nextIf(Types.SYMBOL, nameToken.text)) {
                if (tokens.lat(0) !== Types.TAG_END) {
                    const unexpectedToken = tokens.next();
                    parser.error({
                        title: 'Block name mismatch',
                        pos: unexpectedToken.pos,
                        advice:
                            unexpectedToken.type == Types.SYMBOL
                                ? `Expected end of block ${
                                      nameToken.text
                                  } but instead found end of block ${
                                      tokens.la(0).text
                                  }.`
                                : `endblock must be followed by either '%}' or the name of the open block. Found a token of type ${Types
                                      .ERROR_TABLE[unexpectedToken.type] ||
                                      unexpectedToken.type} instead.`,
                    });
                }
            }
        } else {
            blockStatement = new BlockStatement(
                createNode(Identifier, nameToken, nameToken.text),
                new PrintExpressionStatement(parser.matchExpression())
            );
        }

        setStartFromToken(blockStatement, token);
        setEndFromToken(blockStatement, tokens.expect(Types.TAG_END));

        blockStatement.trimRightBlock =
            openingTagEndToken && hasTagEndTokenTrimRight(openingTagEndToken);
        blockStatement.trimLeftEndblock = !!(
            closingTagStartToken &&
            hasTagStartTokenTrimLeft(closingTagStartToken)
        );

        return blockStatement;
    },
};
