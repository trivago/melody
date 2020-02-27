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
import { hasTagStartTokenTrimLeft, hasTagEndTokenTrimRight } from './util';
import * as Types from './TokenTypes';
import * as n from 'melody-types';

export const GenericTagParser = {
    name: 'genericTwigTag',
    parse(parser) {
        const tokens = parser.tokens,
            tagStartToken = tokens.la(-2);
        let currentToken;

        const twigTag = new n.GenericTwigTag(tokens.la(-1).text);
        while ((currentToken = tokens.la(0))) {
            if (currentToken.type === Types.TAG_END) {
                break;
            } else {
                try {
                    twigTag.parts.push(parser.matchExpression());
                } catch (e) {
                    if (e.errorType === 'UNEXPECTED_TOKEN') {
                        twigTag.parts.push(
                            new n.GenericToken(e.tokenType, e.tokenText)
                        );
                        tokens.next();
                    } else {
                        throw e;
                    }
                }
            }
        }
        tokens.expect(Types.TAG_END);

        twigTag.trimLeft = hasTagStartTokenTrimLeft(tagStartToken);
        twigTag.trimRight = hasTagEndTokenTrimRight(currentToken);

        return twigTag;
    },
};
