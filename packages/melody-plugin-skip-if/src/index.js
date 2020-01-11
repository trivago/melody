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
import * as t from 'babel-types';
import { Node, type, alias, visitor } from 'melody-types';
import template from 'babel-template';
import { Types, setStartFromToken, setEndFromToken } from 'melody-parser';

export class SkipIfBlock extends Node {
    constructor(target, expressions) {
        super();
        this.target = target;
        this.expressions = expressions;
    }
}
type(SkipIfBlock, 'SkipIfBlock');
alias(SkipIfBlock, 'Block');
visitor(SkipIfBlock, 'expressions');

export const SkipIfParser = {
    name: 'skip',
    parse(parser, token) {
        const tokens = parser.tokens;

        tokens.expect(Types.SYMBOL, 'if');
        const condition = tokens.expect(Types.SYMBOL);
        tokens.expect(Types.TAG_END);

        const skipIfBlock = new SkipIfBlock(
            condition,
            parser.parse((tokenText, token, tokens) => {
                return !!(
                    token.type === Types.TAG_START &&
                    tokens.nextIf(Types.SYMBOL, 'endskip')
                );
            }).expressions
        );

        setStartFromToken(skipIfBlock, token);
        setEndFromToken(skipIfBlock, tokens.expect(Types.TAG_END));

        return skipIfBlock;
    },
};

const buildSkipIfDefined = template(`
if (customElements.get(ELEMENT_NAME) !== undefined) {
    SKIP
} else {
    BODY
}
`);

export default {
    tags: [SkipIfParser],
    visitors: [
        {
            analyse: {
                SkipIfBlock(path) {
                    if (path.node.target.text === 'client') {
                        path.skip();
                    }
                },
            },
            convert: {
                SkipIfBlock: {
                    enter(path) {
                        if (path.node.target.text === 'client') {
                            path.replaceWithJS(skip(this));
                        }
                    },
                    exit(path) {
                        const target = path.node.target.text;
                        if (target === 'server') {
                            path.replaceWithMultipleJS(
                                ...path.node.expressions
                            );
                        } else if (target === 'defined') {
                            const el = path.findParentPathOfType('Element');
                            const elementName = el.node.name;
                            if (elementName.indexOf('-') === -1) {
                                this.error(
                                    'skip if defined can only be used inside of a custom element',
                                    el.node.elementNameLoc,
                                    `Custom Element must contain a "-" within their name but "${elementName}" does not seem to contain one.
More information about custom elements can be found here: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements`,
                                    elementName.length
                                );
                            }
                            path.replaceWithJS(
                                buildSkipIfDefined({
                                    ELEMENT_NAME: t.stringLiteral(elementName),
                                    SKIP: skip(this),
                                    BODY: path.node.expressions,
                                })
                            );
                        } else {
                            this.error(
                                'Unknown skip if target',
                                path.node.target.pos,
                                `The target of the skip must be either 'client', 'server' or 'defined' but was "${target}" instead.`,
                                target.length
                            );
                        }
                    },
                },
            },
        },
    ],
};

function skip(state) {
    return t.expressionStatement(
        t.callExpression(
            t.identifier(state.addImportFrom('melody-idom', 'skip')),
            []
        )
    );
}
