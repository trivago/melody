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
import * as n from 'melody-types';
import * as Types from './TokenTypes';
import { LEFT, RIGHT } from './Associativity';
import {
    setStartFromToken,
    setEndFromToken,
    copyStart,
    copyEnd,
    copyLoc,
    createNode,
} from './util';
import { voidElements } from './elementInfo';
import * as he from 'he';

type UnaryOperator = {
    text: String,
    precendence: Number,
    createNode: Function,
};

type BinaryOperator = {
    text: String,
    precendence: Number,
    createNode: Function,
    associativity: LEFT | RIGHT,
    parse: Function,
};

const UNARY = Symbol(),
    BINARY = Symbol(),
    TAG = Symbol(),
    TEST = Symbol();
export default class Parser {
    constructor(tokenStream) {
        this.tokens = tokenStream;
        this[UNARY] = {};
        this[BINARY] = {};
        this[TAG] = {};
        this[TEST] = {};
    }

    addUnaryOperator(op: UnaryOperator) {
        this[UNARY][op.text] = op;
        return this;
    }

    addBinaryOperator(op: BinaryOperator) {
        this[BINARY][op.text] = op;
        return this;
    }

    addTag(tag) {
        this[TAG][tag.name] = tag;
        return this;
    }

    addTest(test) {
        this[TEST][test.text] = test;
    }

    hasTest(test) {
        return !!this[TEST][test];
    }

    getTest(test) {
        return this[TEST][test];
    }

    isUnary(token) {
        return token.type === Types.OPERATOR && !!this[UNARY][token.text];
    }

    getBinaryOperator(token) {
        return token.type === Types.OPERATOR && this[BINARY][token.text];
    }

    parse(test = null) {
        let tokens = this.tokens,
            p = setStartFromToken(new n.SequenceExpression(), tokens.la(0));
        while (!tokens.test(Types.EOF)) {
            const token = tokens.next();
            if (!p) {
                p = setStartFromToken(new n.SequenceExpression(), token);
            }
            if (test && test(tokens.la(0).text, token, tokens)) {
                setEndFromToken(p, token);
                return p;
            }
            switch (token.type) {
                case Types.EXPRESSION_START: {
                    const expression = this.matchExpression();
                    p.add(
                        copyLoc(
                            new n.PrintExpressionStatement(expression),
                            expression
                        )
                    );
                    setEndFromToken(p, tokens.expect(Types.EXPRESSION_END));
                    break;
                }
                case Types.TAG_START:
                    p.add(this.matchTag());
                    break;
                case Types.TEXT:
                    p.add(
                        createNode(
                            n.PrintTextStatement,
                            token,
                            createNode(n.StringLiteral, token, token.text)
                        )
                    );
                    break;
                case Types.ENTITY:
                    p.add(
                        createNode(
                            n.PrintTextStatement,
                            token,
                            createNode(
                                n.StringLiteral,
                                token,
                                he.decode(token.text)
                            )
                        )
                    );
                    break;
                case Types.ELEMENT_START:
                    p.add(this.matchElement());
                    break;
            }
        }
        return p;
    }

    /**
     * matchElement = '<' SYMBOL attributes* '/'? '>' (children)* '<' '/' SYMBOL '>'
     * attributes = SYMBOL '=' (matchExpression | matchString)
     *              | matchExpression
     */
    matchElement() {
        let tokens = this.tokens,
            elementStartToken = tokens.la(0),
            elementName,
            element;
        if (!(elementName = tokens.nextIf(Types.SYMBOL))) {
            this.error({
                title: 'Expected element start',
                pos: elementStartToken.pos,
                advice:
                    tokens.lat(0) === Types.SLASH
                        ? `Unexpected closing "${tokens.la(1)
                              .text}" tag. Seems like your DOM is out of control.`
                        : 'Expected an element to start',
            });
        }

        element = new n.Element(elementName.text);
        setStartFromToken(element, elementStartToken);

        this.matchAttributes(element, tokens);

        if (tokens.nextIf(Types.SLASH)) {
            tokens.expect(Types.ELEMENT_END);
            element.selfClosing = true;
        } else {
            tokens.expect(Types.ELEMENT_END);
            if (voidElements[elementName.text]) {
                element.selfClosing = true;
            } else {
                element.children = this.parse(function(_, token, tokens) {
                    if (
                        token.type === Types.ELEMENT_START &&
                        tokens.lat(0) === Types.SLASH
                    ) {
                        const name = tokens.la(1);
                        if (
                            name.type === Types.SYMBOL &&
                            name.text === elementName.text
                        ) {
                            tokens.next(); // SLASH
                            tokens.next(); // elementName
                            tokens.expect(Types.ELEMENT_END);
                            return true;
                        }
                    }
                    return false;
                }).expressions;
            }
        }
        setEndFromToken(element, tokens.la(-1));
        return element;
    }

    matchAttributes(element, tokens) {
        while (
            tokens.lat(0) !== Types.SLASH &&
            tokens.lat(0) !== Types.ELEMENT_END
        ) {
            const key = tokens.nextIf(Types.SYMBOL);
            if (key) {
                const keyNode = new n.Identifier(key.text);
                setStartFromToken(keyNode, key);
                setEndFromToken(keyNode, key);

                // match an attribute
                if (tokens.nextIf(Types.ASSIGNMENT)) {
                    const start = tokens.expect(Types.STRING_START);
                    let canBeString = true,
                        nodes = [],
                        token;
                    while (!tokens.test(Types.STRING_END)) {
                        if (
                            canBeString &&
                            (token = tokens.nextIf(Types.STRING))
                        ) {
                            nodes[nodes.length] = createNode(
                                n.StringLiteral,
                                token,
                                token.text
                            );
                            canBeString = false;
                        } else if (
                            (token = tokens.nextIf(Types.EXPRESSION_START))
                        ) {
                            nodes[nodes.length] = this.matchExpression();
                            tokens.expect(Types.EXPRESSION_END);
                            canBeString = true;
                        } else {
                            break;
                        }
                    }
                    tokens.expect(Types.STRING_END);
                    if (!nodes.length) {
                        nodes.push(createNode(n.StringLiteral, start, ''));
                    }

                    let expr = nodes[0];
                    for (let i = 1, len = nodes.length; i < len; i++) {
                        const { line, column } = expr.loc.start;
                        expr = new n.BinaryConcatExpression(expr, nodes[i]);
                        expr.loc.start.line = line;
                        expr.loc.start.column = column;
                        copyEnd(expr, expr.right);
                    }
                    const attr = new n.Attribute(keyNode, expr);
                    copyStart(attr, keyNode);
                    copyEnd(attr, expr);
                    element.attributes.push(attr);
                } else {
                    element.attributes.push(
                        copyLoc(new n.Attribute(keyNode), keyNode)
                    );
                }
            } else if (tokens.nextIf(Types.EXPRESSION_START)) {
                element.attributes.push(this.matchExpression());
                tokens.expect(Types.EXPRESSION_END);
            } else {
                this.error({
                    title: 'Invalid token',
                    pos: tokens.la(0).pos,
                    advice:
                        'A tag must consist of attributes or expressions. Twig Tags are not allowed.',
                });
            }
        }
    }

    error(options) {
        this.tokens.error(options.title, options.pos, options.advice);
    }

    matchTag() {
        let tokens = this.tokens,
            tag = tokens.expect(Types.SYMBOL),
            parser = this[TAG][tag.text];
        if (!parser) {
            tokens.error(
                `Unknown tag "${tag.text}"`,
                tag.pos,
                `Expected a known tag such as\n- ${Object.getOwnPropertyNames(
                    this[TAG]
                ).join('\n- ')}`,
                tag.length
            );
        }
        return parser.parse(this, tag);
    }

    matchExpression(precedence = 0) {
        let expr = this.getPrimary(),
            tokens = this.tokens,
            token,
            op;
        while (
            (token = tokens.la(0)) &&
            token.type !== Types.EOF &&
            (op = this.getBinaryOperator(token)) &&
            op.precedence >= precedence
        ) {
            const opToken = tokens.next(); // consume the operator
            if (op.parse) {
                expr = op.parse(this, opToken, expr);
            } else {
                const expr1 = this.matchExpression(
                    op.associativity === LEFT
                        ? op.precedence + 1
                        : op.precedence
                );
                expr = op.createNode(token, expr, expr1);
            }
            token = tokens.la(0);
        }

        return precedence === 0 ? this.matchConditionalExpression(expr) : expr;
    }

    getPrimary() {
        let tokens = this.tokens,
            token = tokens.la(0);
        if (this.isUnary(token)) {
            const op = this[UNARY][token.text];
            tokens.next(); // consume operator
            const expr = this.matchExpression(op.precedence);
            return this.matchPostfixExpression(op.createNode(token, expr));
        } else if (tokens.test(Types.LPAREN)) {
            tokens.next(); // consume '('
            const expr = this.matchExpression();
            tokens.expect(Types.RPAREN);
            return this.matchPostfixExpression(expr);
        }

        return this.matchPrimaryExpression();
    }

    matchPrimaryExpression() {
        let tokens = this.tokens,
            token = tokens.la(0),
            node;
        switch (token.type) {
            case Types.NULL:
                node = createNode(n.NullLiteral, tokens.next());
                break;
            case Types.FALSE:
                node = createNode(n.BooleanLiteral, tokens.next(), false);
                break;
            case Types.TRUE:
                node = createNode(n.BooleanLiteral, tokens.next(), true);
                break;
            case Types.SYMBOL:
                tokens.next();
                if (tokens.test(Types.LPAREN)) {
                    // SYMBOL '(' arguments* ')'
                    node = new n.CallExpression(
                        createNode(n.Identifier, token, token.text),
                        this.matchArguments()
                    );
                    copyStart(node, node.callee);
                    setEndFromToken(node, tokens.la(-1)); // ')'
                } else {
                    node = createNode(n.Identifier, token, token.text);
                }
                break;
            case Types.NUMBER:
                node = createNode(
                    n.NumericLiteral,
                    token,
                    Number(tokens.next())
                );
                break;
            case Types.STRING_START:
                node = this.matchStringExpression();
                break;
            // potentially missing: OPERATOR type
            default:
                if (token.type === Types.LBRACE) {
                    node = this.matchArray();
                } else if (token.type === Types.LBRACKET) {
                    node = this.matchMap();
                } else {
                    this.error({
                        title:
                            'Unexpected token "' +
                            token.type +
                            '" of value "' +
                            token.text +
                            '"',
                        pos: token.pos,
                    });
                }
                break;
        }

        return this.matchPostfixExpression(node);
    }

    matchStringExpression() {
        let tokens = this.tokens,
            nodes = [],
            canBeString = true,
            token,
            stringStart,
            stringEnd;
        stringStart = tokens.expect(Types.STRING_START);
        while (!tokens.test(Types.STRING_END)) {
            if (canBeString && (token = tokens.nextIf(Types.STRING))) {
                nodes[nodes.length] = createNode(
                    n.StringLiteral,
                    token,
                    token.text
                );
                canBeString = false;
            } else if ((token = tokens.nextIf(Types.INTERPOLATION_START))) {
                nodes[nodes.length] = this.matchExpression();
                tokens.expect(Types.INTERPOLATION_END);
                canBeString = true;
            } else {
                break;
            }
        }
        stringEnd = tokens.expect(Types.STRING_END);

        if (!nodes.length) {
            return setEndFromToken(
                createNode(n.StringLiteral, stringStart, ''),
                stringEnd
            );
        }

        let expr = nodes[0];
        for (let i = 1, len = nodes.length; i < len; i++) {
            const { line, column } = expr.loc.start;
            expr = new n.BinaryConcatExpression(expr, nodes[i]);
            expr.loc.start.line = line;
            expr.loc.start.column = column;
            copyEnd(expr, expr.right);
        }

        return expr;
    }

    matchConditionalExpression(test: Node) {
        let tokens = this.tokens,
            condition = test,
            consequent,
            alternate;
        while (tokens.nextIf(Types.QUESTION_MARK)) {
            if (!tokens.nextIf(Types.COLON)) {
                consequent = this.matchExpression();
                if (tokens.nextIf(Types.COLON)) {
                    alternate = this.matchExpression();
                } else {
                    alternate = null;
                }
            } else {
                consequent = null;
                alternate = this.matchExpression();
            }
            const { line, column } = condition.loc.start;
            condition = new n.ConditionalExpression(
                condition,
                consequent,
                alternate
            );
            condition.loc.start = { line, column };
            copyEnd(condition, alternate || consequent);
        }
        return condition;
    }

    matchArray() {
        let tokens = this.tokens,
            array = new n.ArrayExpression(),
            start = tokens.expect(Types.LBRACE);
        setStartFromToken(array, start);
        while (!tokens.test(Types.RBRACE) && !tokens.test(Types.EOF)) {
            array.elements.push(this.matchExpression());
            if (!tokens.test(Types.RBRACE)) {
                tokens.expect(Types.COMMA);
                // support trailing commas
                if (tokens.test(Types.RBRACE)) {
                    break;
                }
            }
        }
        setEndFromToken(array, tokens.expect(Types.RBRACE));
        return array;
    }

    matchMap() {
        let tokens = this.tokens,
            token,
            obj = new n.ObjectExpression(),
            startToken = tokens.expect(Types.LBRACKET);
        setStartFromToken(obj, startToken);
        while (!tokens.test(Types.RBRACKET) && !tokens.test(Types.EOF)) {
            let computed = false,
                key,
                value;
            if (tokens.test(Types.STRING_START)) {
                key = this.matchStringExpression();
                if (!n.is('StringLiteral', key)) {
                    computed = true;
                }
            } else if ((token = tokens.nextIf(Types.SYMBOL))) {
                key = createNode(n.Identifier, token, token.text);
            } else if ((token = tokens.nextIf(Types.NUMBER))) {
                key = createNode(n.NumericLiteral, token, Number(token.text));
            } else if (tokens.test(Types.LPAREN)) {
                key = this.matchExpression();
                computed = true;
            } else {
                this.error({
                    title: 'Invalid map key',
                    pos: tokens.la(0).pos,
                    advice:
                        'Key must be a string, symbol or a number but was ' +
                        tokens.next(),
                });
            }
            tokens.expect(Types.COLON);
            value = this.matchExpression();
            const prop = new n.ObjectProperty(key, value, computed);
            copyStart(prop, key);
            copyEnd(prop, value);
            obj.properties.push(prop);
            if (!tokens.test(Types.RBRACKET)) {
                tokens.expect(Types.COMMA);
                // support trailing comma
                if (tokens.test(Types.RBRACKET)) {
                    break;
                }
            }
        }
        setEndFromToken(obj, tokens.expect(Types.RBRACKET));
        return obj;
    }

    matchPostfixExpression(expr) {
        const tokens = this.tokens;
        let node = expr;
        while (!tokens.test(Types.EOF)) {
            if (tokens.test(Types.DOT) || tokens.test(Types.LBRACE)) {
                node = this.matchSubscriptExpression(node);
            } else if (tokens.test(Types.PIPE)) {
                tokens.next();
                node = this.matchFilterExpression(node);
            } else {
                break;
            }
        }

        return node;
    }

    matchSubscriptExpression(node) {
        let tokens = this.tokens,
            op = tokens.next();
        if (op.type === Types.DOT) {
            let token = tokens.next(),
                computed = false,
                property;
            if (token.type === Types.SYMBOL) {
                property = createNode(n.Identifier, token, token.text);
            } else if (token.type === Types.NUMBER) {
                property = createNode(
                    n.NumericLiteral,
                    token,
                    Number(token.text)
                );
                computed = true;
            } else {
                this.error({
                    title: 'Invalid token',
                    pos: token.pos,
                    advice:
                        'Expected number or symbol, found ' +
                        token +
                        ' instead',
                });
            }

            const memberExpr = new n.MemberExpression(node, property, computed);
            copyStart(memberExpr, node);
            copyEnd(memberExpr, property);
            if (tokens.test(Types.LPAREN)) {
                const callExpr = new n.CallExpression(
                    memberExpr,
                    this.matchArguments()
                );
                copyStart(callExpr, memberExpr);
                setEndFromToken(callExpr, tokens.la(-1));
                return callExpr;
            }
            return memberExpr;
        } else {
            let arg, start;
            if (tokens.test(Types.COLON)) {
                // slice
                tokens.next();
                start = null;
            } else {
                arg = this.matchExpression();
                if (tokens.test(Types.COLON)) {
                    start = arg;
                    arg = null;
                    tokens.next();
                }
            }

            if (arg) {
                return setEndFromToken(
                    copyStart(new n.MemberExpression(node, arg, true), node),
                    tokens.expect(Types.RBRACE)
                );
            } else {
                // slice
                const result = new n.SliceExpression(
                    node,
                    start,
                    tokens.test(Types.RBRACE) ? null : this.matchExpression()
                );
                copyStart(result, node);
                setEndFromToken(result, tokens.expect(Types.RBRACE));
                return result;
            }
        }
    }

    matchFilterExpression(node) {
        let tokens = this.tokens,
            target = node;
        while (!tokens.test(Types.EOF)) {
            let token = tokens.expect(Types.SYMBOL),
                name = createNode(n.Identifier, token, token.text),
                args;
            if (tokens.test(Types.LPAREN)) {
                args = this.matchArguments();
            } else {
                args = [];
            }
            const newTarget = new n.FilterExpression(target, name, args);
            copyStart(newTarget, target);
            if (newTarget.arguments.length) {
                copyEnd(
                    newTarget,
                    newTarget.arguments[newTarget.arguments.length - 1]
                );
            } else {
                copyEnd(newTarget, target);
            }
            target = newTarget;

            if (!tokens.test(Types.PIPE) || tokens.test(Types.EOF)) {
                break;
            }

            tokens.next(); // consume '|'
        }
        return target;
    }

    matchArguments() {
        let tokens = this.tokens,
            args = [];
        tokens.expect(Types.LPAREN);
        while (!tokens.test(Types.RPAREN) && !tokens.test(Types.EOF)) {
            if (
                tokens.test(Types.SYMBOL) &&
                tokens.lat(1) === Types.ASSIGNMENT
            ) {
                const name = tokens.next();
                tokens.next();
                const value = this.matchExpression();
                const arg = new n.NamedArgumentExpression(
                    createNode(n.Identifier, name, name.text),
                    value
                );
                copyEnd(arg, value);
                args.push(arg);
            } else {
                args.push(this.matchExpression());
            }

            if (!tokens.test(Types.COMMA)) {
                tokens.expect(Types.RPAREN);
                return args;
            }
            tokens.expect(Types.COMMA);
        }
        tokens.expect(Types.RPAREN);
        return args;
    }
}
