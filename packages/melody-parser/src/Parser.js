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
    copySource,
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
    constructor(tokenStream, options) {
        this.tokens = tokenStream;
        this[UNARY] = {};
        this[BINARY] = {};
        this[TAG] = {};
        this[TEST] = {};
        this.source = null;
        if (options && options.source) {
            this.source = options.source;
            options.source = undefined;
        }
        this.options = Object.assign(
            {},
            {
                ignoreComments: true,
                ignoreHtmlComments: true,
                decodeEntities: true,
            },
            options
        );
    }

    applyExtension(ext) {
        if (ext.tags) {
            for (const tag of ext.tags) {
                this.addTag(tag);
            }
        }
        if (ext.unaryOperators) {
            for (const op of ext.unaryOperators) {
                this.addUnaryOperator(op);
            }
        }
        if (ext.binaryOperators) {
            for (const op of ext.binaryOperators) {
                this.addBinaryOperator(op);
            }
        }
        if (ext.tests) {
            for (const test of ext.tests) {
                this.addTest(test);
            }
        }
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
                    const statement = new n.PrintExpressionStatement(
                        expression
                    );
                    const endToken = tokens.expect(Types.EXPRESSION_END);
                    setStartFromToken(statement, token);
                    setEndFromToken(statement, endToken);
                    copySource(statement, this.source);

                    setEndFromToken(p, endToken);
                    p.add(statement);

                    break;
                }
                case Types.TAG_START:
                    p.add(this.matchTag());
                    break;
                case Types.TEXT: {
                    const textStringLiteral = createNode(
                        n.StringLiteral,
                        token,
                        token.text
                    );
                    copySource(textStringLiteral, this.source);
                    const textTextStatement = createNode(
                        n.PrintTextStatement,
                        token,
                        textStringLiteral
                    );
                    copySource(textTextStatement, this.source);
                    p.add(textTextStatement);
                    break;
                }
                case Types.ENTITY: {
                    const entityStringLiteral = createNode(
                        n.StringLiteral,
                        token,
                        this.options.decodeEntities
                            ? he.decode(token.text)
                            : token.text
                    );
                    copySource(entityStringLiteral, this.source);
                    const entityTextStatement = createNode(
                        n.PrintTextStatement,
                        token,
                        entityStringLiteral
                    );
                    copySource(entityTextStatement, this.source);
                    p.add(entityTextStatement);
                    break;
                }
                case Types.ELEMENT_START:
                    p.add(this.matchElement());
                    break;
                case Types.COMMENT:
                    if (!this.options.ignoreComments) {
                        const stringLiteral = createNode(
                            n.StringLiteral,
                            token,
                            token.text
                        );
                        copySource(stringLiteral, this.source);
                        const twigComment = createNode(
                            n.TwigComment,
                            token,
                            stringLiteral
                        );
                        copySource(twigComment, this.source);
                        p.add(twigComment);
                    }
                    break;
                case Types.HTML_COMMENT:
                    if (!this.options.ignoreHtmlComments) {
                        const stringLiteral = createNode(
                            n.StringLiteral,
                            token,
                            token.text
                        );
                        copySource(stringLiteral, this.source);
                        const htmlComment = createNode(
                            n.HtmlComment,
                            token,
                            stringLiteral
                        );
                        copySource(htmlComment, this.source);
                        p.add(htmlComment);
                    }
                    break;
            }
        }
        copySource(p, this.source);
        return p;
    }

    /**
     * matchElement = '<' SYMBOL attributes* '/'? '>' (children)* '<' '/' SYMBOL '>'
     * attributes = SYMBOL '=' (matchExpression | matchString)
     *              | matchExpression
     */
    matchElement() {
        const tokens = this.tokens,
            tagNameToken = tokens.la(0),
            tagStartToken = tokens.la(-1);
        let elementName;
        if (!(elementName = tokens.nextIf(Types.SYMBOL))) {
            this.error({
                title: 'Expected element start',
                pos: tagNameToken.pos,
                advice:
                    tokens.lat(0) === Types.SLASH
                        ? `Unexpected closing "${
                              tokens.la(1).text
                          }" tag. Seems like your DOM is out of control.`
                        : 'Expected an element to start',
            });
        }

        const element = new n.Element(elementName.text);
        setStartFromToken(element, tagNameToken);

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
        copySource(element, this.source);
        // Manually copy source because messing with element.loc
        // causes problems with error reporting
        if (this.source) {
            element.originalSource = this.source.substring(
                tagStartToken.pos.index,
                element.loc.end.index
            );
        }

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
                            copySource(nodes[nodes.length - 1], this.source);
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
                        const node = createNode(n.StringLiteral, start, '');
                        copySource(node, this.source);
                        nodes.push(node);
                    }

                    let expr = nodes[0];
                    for (let i = 1, len = nodes.length; i < len; i++) {
                        const { line, column } = expr.loc.start;
                        expr = new n.BinaryConcatExpression(expr, nodes[i]);
                        expr.loc.start.line = line;
                        expr.loc.start.column = column;
                        copyEnd(expr, expr.right);
                        copySource(expr, this.source);
                    }
                    // Distinguish between BinaryConcatExpression generated by
                    // this Parser (implicit before parsing), and those that the
                    // user wrote explicitly.
                    if (nodes.length > 1) {
                        expr.wasImplicitConcatenation = true;
                    }
                    const attr = new n.Attribute(keyNode, expr);
                    copyStart(attr, keyNode);
                    copyEnd(attr, expr);
                    copySource(attr, this.source);
                    element.attributes.push(attr);
                } else {
                    element.attributes.push(
                        copySource(
                            copyLoc(new n.Attribute(keyNode), keyNode),
                            this.source
                        )
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
        const tokens = this.tokens;
        const tagStartToken = tokens.la(-1);

        const tag = tokens.expect(Types.SYMBOL),
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

        const result = parser.parse(this, tag);
        const tagEndToken = tokens.la(-1);
        result.trimLeft = tagStartToken.text.endsWith('-');
        result.trimRight = tagEndToken.text.startsWith('-');

        setStartFromToken(result, tagStartToken);
        setEndFromToken(result, tagEndToken);
        copySource(result, this.source);

        return result;
    }

    matchExpression(precedence = 0) {
        const tokens = this.tokens;
        let token,
            op,
            trimLeft = false;

        // Check for {{- (trim preceding whitespace)
        if (
            tokens.la(-1).type === Types.EXPRESSION_START &&
            tokens.la(-1).text.endsWith('-')
        ) {
            trimLeft = true;
        }

        let expr = this.getPrimary();
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
            copySource(expr, this.source);
            token = tokens.la(0);
        }

        const result =
            precedence === 0 ? this.matchConditionalExpression(expr) : expr;

        // Check for -}} (trim following whitespace)
        if (token.type === Types.EXPRESSION_END && token.text.startsWith('-')) {
            result.trimRight = true;
        }
        if (trimLeft) {
            result.trimLeft = trimLeft;
        }

        return result;
    }

    getPrimary() {
        let tokens = this.tokens,
            token = tokens.la(0);
        if (this.isUnary(token)) {
            const op = this[UNARY][token.text];
            tokens.next(); // consume operator
            const expr = this.matchExpression(op.precedence);
            return this.matchPostfixExpression(
                copySource(op.createNode(token, expr), this.source)
            );
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
                copySource(node, this.source);
                break;
            case Types.FALSE:
                node = createNode(n.BooleanLiteral, tokens.next(), false);
                copySource(node, this.source);
                break;
            case Types.TRUE:
                node = createNode(n.BooleanLiteral, tokens.next(), true);
                copySource(node, this.source);
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
                    copySource(node, this.source);
                } else {
                    node = createNode(n.Identifier, token, token.text);
                    copySource(node, this.source);
                }
                break;
            case Types.NUMBER:
                node = createNode(
                    n.NumericLiteral,
                    token,
                    Number(tokens.next())
                );
                copySource(node, this.source);
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
        let canBeString = true,
            token;
        const tokens = this.tokens,
            nodes = [],
            stringStart = tokens.expect(Types.STRING_START);
        while (!tokens.test(Types.STRING_END)) {
            if (canBeString && (token = tokens.nextIf(Types.STRING))) {
                nodes[nodes.length] = createNode(
                    n.StringLiteral,
                    token,
                    token.text
                );
                copySource(nodes[nodes.length - 1], this.source);
                canBeString = false;
            } else if ((token = tokens.nextIf(Types.INTERPOLATION_START))) {
                nodes[nodes.length] = this.matchExpression();
                tokens.expect(Types.INTERPOLATION_END);
                canBeString = true;
            } else {
                break;
            }
        }
        const stringEnd = tokens.expect(Types.STRING_END);

        if (!nodes.length) {
            return copySource(
                setEndFromToken(
                    createNode(n.StringLiteral, stringStart, ''),
                    stringEnd
                ),
                this.source
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

        if (nodes.length > 1) {
            expr.wasImplicitConcatenation = true;
        }

        setStartFromToken(expr, stringStart);
        setEndFromToken(expr, stringEnd);
        copySource(expr, this.source);

        return expr;
    }

    matchConditionalExpression(test: Node) {
        const tokens = this.tokens;
        let condition = test,
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
            copySource(condition, this.source);
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
                if (!n.is(key, 'StringLiteral')) {
                    computed = true;
                }
            } else if ((token = tokens.nextIf(Types.SYMBOL))) {
                key = createNode(n.Identifier, token, token.text);
                copySource(key, this.source);
            } else if ((token = tokens.nextIf(Types.NUMBER))) {
                key = createNode(n.NumericLiteral, token, Number(token.text));
                copySource(key, this.source);
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
            copySource(prop, this.source);
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
                copySource(property, this.source);
            } else if (token.type === Types.NUMBER) {
                property = createNode(
                    n.NumericLiteral,
                    token,
                    Number(token.text)
                );
                copySource(property, this.source);
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
            copySource(memberExpr, this.source);
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
            copySource(newTarget, this.source);
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
                copySource(arg, this.source);
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
