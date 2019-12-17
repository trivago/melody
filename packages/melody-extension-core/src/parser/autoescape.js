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
import {
    Types,
    setStartFromToken,
    setEndFromToken,
    hasTagStartTokenTrimLeft,
    hasTagEndTokenTrimRight,
} from 'melody-parser';
import { AutoescapeBlock } from './../types';

export const AutoescapeParser = {
    name: 'autoescape',
    parse(parser, token) {
        const tokens = parser.tokens;

        let escapeType = null,
            stringStartToken,
            openingTagEndToken,
            closingTagStartToken;
        if (tokens.nextIf(Types.TAG_END)) {
            openingTagEndToken = tokens.la(-1);
            escapeType = null;
        } else if ((stringStartToken = tokens.nextIf(Types.STRING_START))) {
            escapeType = tokens.expect(Types.STRING).text;
            if (!tokens.nextIf(Types.STRING_END)) {
                parser.error({
                    title:
                        'autoescape type declaration must be a simple string',
                    pos: tokens.la(0).pos,
                    advice: `The type declaration for autoescape must be a simple string such as 'html' or 'js'.
I expected the current string to end with a ${
                        stringStartToken.text
                    } but instead found ${Types.ERROR_TABLE[tokens.lat(0)] ||
                        tokens.lat(0)}.`,
                });
            }
            openingTagEndToken = tokens.la(0);
        } else if (tokens.nextIf(Types.FALSE)) {
            escapeType = false;
            openingTagEndToken = tokens.la(0);
        } else if (tokens.nextIf(Types.TRUE)) {
            escapeType = true;
            openingTagEndToken = tokens.la(0);
        } else {
            parser.error({
                title: 'Invalid autoescape type declaration',
                pos: tokens.la(0).pos,
                advice: `Expected type of autoescape to be a string, boolean or not specified. Found ${
                    tokens.la(0).type
                } instead.`,
            });
        }

        const autoescape = new AutoescapeBlock(escapeType);
        setStartFromToken(autoescape, token);
        let tagEndToken;
        autoescape.expressions = parser.parse((_, token, tokens) => {
            if (
                token.type === Types.TAG_START &&
                tokens.nextIf(Types.SYMBOL, 'endautoescape')
            ) {
                closingTagStartToken = token;
                tagEndToken = tokens.expect(Types.TAG_END);
                return true;
            }
            return false;
        }).expressions;
        setEndFromToken(autoescape, tagEndToken);

        autoescape.trimRightAutoescape = hasTagEndTokenTrimRight(
            openingTagEndToken
        );
        autoescape.trimLeftEndautoescape = hasTagStartTokenTrimLeft(
            closingTagStartToken
        );

        return autoescape;
    },
};
