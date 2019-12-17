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
import { MountStatement } from '../types';
import {
    Types,
    setStartFromToken,
    setEndFromToken,
    createNode,
    hasTagStartTokenTrimLeft,
    hasTagEndTokenTrimRight,
} from 'melody-parser';

export const MountParser = {
    name: 'mount',
    parse(parser, token) {
        const tokens = parser.tokens;

        let name = null,
            source = null,
            key = null,
            async = false,
            delayBy = 0,
            argument = null;

        if (tokens.test(Types.SYMBOL, 'async')) {
            // we might be looking at an async mount
            const nextToken = tokens.la(1);
            if (nextToken.type === Types.STRING_START) {
                async = true;
                tokens.next();
            }
        }

        if (tokens.test(Types.STRING_START)) {
            source = parser.matchStringExpression();
        } else {
            const nameToken = tokens.expect(Types.SYMBOL);
            name = createNode(Identifier, nameToken, nameToken.text);
            if (tokens.nextIf(Types.SYMBOL, 'from')) {
                source = parser.matchStringExpression();
            }
        }

        if (tokens.nextIf(Types.SYMBOL, 'as')) {
            key = parser.matchExpression();
        }

        if (tokens.nextIf(Types.SYMBOL, 'with')) {
            argument = parser.matchExpression();
        }

        if (async) {
            if (tokens.nextIf(Types.SYMBOL, 'delay')) {
                tokens.expect(Types.SYMBOL, 'placeholder');
                tokens.expect(Types.SYMBOL, 'by');
                delayBy = Number.parseInt(tokens.expect(Types.NUMBER).text, 10);
                if (tokens.nextIf(Types.SYMBOL, 's')) {
                    delayBy *= 1000;
                } else {
                    tokens.expect(Types.SYMBOL, 'ms');
                }
            }
        }

        const mountStatement = new MountStatement(
            name,
            source,
            key,
            argument,
            async,
            delayBy
        );

        let openingTagEndToken,
            catchTagStartToken,
            catchTagEndToken,
            endmountTagStartToken;

        if (async) {
            tokens.expect(Types.TAG_END);
            openingTagEndToken = tokens.la(-1);

            mountStatement.body = parser.parse((tokenText, token, tokens) => {
                return (
                    token.type === Types.TAG_START &&
                    (tokens.test(Types.SYMBOL, 'catch') ||
                        tokens.test(Types.SYMBOL, 'endmount'))
                );
            });

            if (tokens.nextIf(Types.SYMBOL, 'catch')) {
                catchTagStartToken = tokens.la(-2);
                const errorVariableName = tokens.expect(Types.SYMBOL);
                mountStatement.errorVariableName = createNode(
                    Identifier,
                    errorVariableName,
                    errorVariableName.text
                );
                tokens.expect(Types.TAG_END);
                catchTagEndToken = tokens.la(-1);
                mountStatement.otherwise = parser.parse(
                    (tokenText, token, tokens) => {
                        return (
                            token.type === Types.TAG_START &&
                            tokens.test(Types.SYMBOL, 'endmount')
                        );
                    }
                );
            }
            tokens.expect(Types.SYMBOL, 'endmount');
            endmountTagStartToken = tokens.la(-2);
        }

        setStartFromToken(mountStatement, token);
        setEndFromToken(mountStatement, tokens.expect(Types.TAG_END));

        mountStatement.trimRightMount = !!(
            openingTagEndToken && hasTagEndTokenTrimRight(openingTagEndToken)
        );
        mountStatement.trimLeftCatch = !!(
            catchTagStartToken && hasTagStartTokenTrimLeft(catchTagStartToken)
        );
        mountStatement.trimRightCatch = !!(
            catchTagEndToken && hasTagEndTokenTrimRight(catchTagEndToken)
        );
        mountStatement.trimLeftEndmount = !!(
            endmountTagStartToken &&
            hasTagStartTokenTrimLeft(endmountTagStartToken)
        );

        return mountStatement;
    },
};
