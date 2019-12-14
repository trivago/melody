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
import {
    Types,
    setStartFromToken,
    setEndFromToken,
    createNode,
    hasTagStartTokenTrimLeft,
    hasTagEndTokenTrimRight,
} from 'melody-parser';
import { MacroDeclarationStatement } from './../types';

export const MacroParser = {
    name: 'macro',
    parse(parser, token) {
        const tokens = parser.tokens;

        const nameToken = tokens.expect(Types.SYMBOL);
        const args = [];

        tokens.expect(Types.LPAREN);
        while (!tokens.test(Types.RPAREN) && !tokens.test(Types.EOF)) {
            const arg = tokens.expect(Types.SYMBOL);
            args.push(createNode(Identifier, arg, arg.text));

            if (!tokens.nextIf(Types.COMMA) && !tokens.test(Types.RPAREN)) {
                // not followed by comma or rparen
                parser.error({
                    title: 'Expected comma or ")"',
                    pos: tokens.la(0).pos,
                    advice:
                        'The argument list of a macro can only consist of parameter names separated by commas.',
                });
            }
        }
        tokens.expect(Types.RPAREN);

        const openingTagEndToken = tokens.la(0);
        let closingTagStartToken;

        const body = parser.parse((tokenText, token, tokens) => {
            const result = !!(
                token.type === Types.TAG_START &&
                tokens.nextIf(Types.SYMBOL, 'endmacro')
            );
            if (result) {
                closingTagStartToken = token;
            }
            return result;
        });

        if (tokens.test(Types.SYMBOL)) {
            var nameEndToken = tokens.next();
            if (nameToken.text !== nameEndToken.text) {
                parser.error({
                    title: `Macro name mismatch, expected "${
                        nameToken.text
                    }" but found "${nameEndToken.text}"`,
                    pos: nameEndToken.pos,
                });
            }
        }

        const macroDeclarationStatement = new MacroDeclarationStatement(
            createNode(Identifier, nameToken, nameToken.text),
            args,
            body
        );

        setStartFromToken(macroDeclarationStatement, token);
        setEndFromToken(
            macroDeclarationStatement,
            tokens.expect(Types.TAG_END)
        );

        macroDeclarationStatement.trimRightMacro = hasTagEndTokenTrimRight(
            openingTagEndToken
        );
        macroDeclarationStatement.trimLeftEndmacro = hasTagStartTokenTrimLeft(
            closingTagStartToken
        );

        return macroDeclarationStatement;
    },
};
