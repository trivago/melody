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
import { SpacelessBlock } from './../types';

export const SpacelessParser = {
    name: 'spaceless',
    parse(parser, token) {
        const tokens = parser.tokens;

        tokens.expect(Types.TAG_END);
        const openingTagEndToken = tokens.la(-1);
        let closingTagStartToken;

        const body = parser.parse((tokenText, token, tokens) => {
            const result = !!(
                token.type === Types.TAG_START &&
                tokens.nextIf(Types.SYMBOL, 'endspaceless')
            );
            closingTagStartToken = token;
            return result;
        }).expressions;

        const spacelessBlock = new SpacelessBlock(body);
        setStartFromToken(spacelessBlock, token);
        setEndFromToken(spacelessBlock, tokens.expect(Types.TAG_END));

        spacelessBlock.trimRightSpaceless = hasTagEndTokenTrimRight(
            openingTagEndToken
        );
        spacelessBlock.trimLeftEndspaceless = !!(
            closingTagStartToken &&
            hasTagStartTokenTrimLeft(closingTagStartToken)
        );

        return spacelessBlock;
    },
};
