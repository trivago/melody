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
} from 'melody-parser';

export const MountParser = {
    name: 'mount',
    parse(parser, token) {
        const tokens = parser.tokens;

        let name = null,
            source = null,
            key = null,
            argument = null;

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

        const mountStatement = new MountStatement(name, source, key, argument);

        setStartFromToken(mountStatement, token);
        setEndFromToken(mountStatement, tokens.expect(Types.TAG_END));

        return mountStatement;
    },
};
