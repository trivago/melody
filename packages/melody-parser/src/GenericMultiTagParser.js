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
import { GenericTagParser } from './GenericTagParser';
import * as Types from './TokenTypes';

const tagMatchesOneOf = (tokenStream, tagNames) => {
    for (let i = 0; i < tagNames.length; i++) {
        if (tokenStream.test(Types.SYMBOL, tagNames[i])) {
            return true;
        }
    }
    return false;
};

export const createMultiTagParser = (tagName, subTags = []) => ({
    name: 'genericTwigMultiTag',
    parse(parser, token) {
        const tokens = parser.tokens,
            tagStartToken = tokens.la(-1);

        if (subTags.length === 0) {
            subTags.push('end' + tagName);
        }

        const twigTag = GenericTagParser.parse(parser, token);
        let currentTagName = tagName;
        const endTagName = subTags[subTags.length - 1];

        while (currentTagName !== endTagName) {
            // Parse next section
            twigTag.sections.push(
                parser.parse((tokenText, token, tokens) => {
                    const hasReachedNextTag =
                        token.type === Types.TAG_START &&
                        tagMatchesOneOf(tokens, subTags);
                    return hasReachedNextTag;
                })
            );
            tokens.next(); // Get past "{%"

            // Parse next tag
            const childTag = GenericTagParser.parse(parser);
            twigTag.sections.push(childTag);
            currentTagName = childTag.tagName;
        }

        setStartFromToken(twigTag, tagStartToken);
        setEndFromToken(twigTag, tokens.la(0));

        return twigTag;
    },
});
