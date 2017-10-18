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
import { Types, setStartFromToken, setEndFromToken } from 'melody-parser';
import { IncludeStatement } from './../types';

export const IncludeParser = {
    name: 'include',
    parse(parser, token) {
        const tokens = parser.tokens;

        const includeStatement = new IncludeStatement(parser.matchExpression());

        if (tokens.nextIf(Types.SYMBOL, 'ignore')) {
            tokens.expect(Types.SYMBOL, 'missing');
            includeStatement.ignoreMissing = true;
        }

        if (tokens.nextIf(Types.SYMBOL, 'with')) {
            includeStatement.argument = parser.matchExpression();
        }

        if (tokens.nextIf(Types.SYMBOL, 'only')) {
            includeStatement.contextFree = true;
        }

        setStartFromToken(includeStatement, token);
        setEndFromToken(includeStatement, tokens.expect(Types.TAG_END));

        return includeStatement;
    },
};
