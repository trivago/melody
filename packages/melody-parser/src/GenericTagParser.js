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
import { setStartFromToken, setEndFromToken } from './util';
import * as Types from './TokenTypes';
import * as n from 'melody-types';

export const GenericTagParser = {
    name: 'genericTwigTag',
    parse(parser, token) {
        const tokens = parser.tokens,
            tagStartToken = tokens.la(-1);
        let currentToken;

        const twigTag = new n.GenericTwigTag(tokens.la(-1).text);
        while ((currentToken = tokens.la(0))) {
            if (currentToken.type === Types.TAG_END) {
                break;
            } else {
                twigTag.parts.push(parser.matchExpression());
            }
        }
        setStartFromToken(twigTag, tagStartToken);
        setEndFromToken(twigTag, currentToken);

        return twigTag;
    },
};
