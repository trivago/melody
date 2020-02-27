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

export const TYPE_MAP = Object.create(null);
export const ALIAS_TO_TYPE = Object.create(null);
export const PATH_CACHE_KEY = Symbol();

const IS_ALIAS_OF = Object.create(null);

export class Node {
    constructor() {
        this.loc = {
            source: null,
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
        };
        this[PATH_CACHE_KEY] = [];
    }

    toJSON() {
        return Object.getOwnPropertyNames(this).reduce(
            (acc, name) => {
                if (name === 'loc' || name === 'parent') {
                    return acc;
                }
                const value = this[name];
                if (Array.isArray(value)) {
                    acc[name] = value.map(val => val.toJSON());
                } else {
                    acc[name] = value && value.toJSON ? value.toJSON() : value;
                }
                return acc;
            },
            {
                type: this.type,
            }
        );
    }

    static registerType(type) {
        if (Node['is' + type]) {
            return;
        }

        Node['is' + type] = function(node) {
            return is(node, type);
        };

        // Node['assert' + type] = function(node) {
        //   if (!is(node, type)) {
        //     throw new Error('Expected node to be of type ' + type + ' but was ' + (node ? node.type : 'undefined') + ' instead');
        //   }
        // };
    }
}
Node.registerType('Scope');

export function is(node, type) {
    if (!node) return false;

    return (
        node.type === type ||
        (IS_ALIAS_OF[type] && IS_ALIAS_OF[type][node.type]) ||
        t.is(type, node)
    );
}

export function visitor(type, ...fields: String) {
    type.prototype.visitorKeys = fields;
}

export function alias(type, ...aliases: String) {
    type.prototype.aliases = aliases;
    for (let i = 0, len = aliases.length; i < len; i++) {
        const alias = aliases[i];
        if (!ALIAS_TO_TYPE[alias]) {
            ALIAS_TO_TYPE[alias] = [];
        }
        ALIAS_TO_TYPE[alias].push(type.prototype.type);
        if (!IS_ALIAS_OF[alias]) {
            IS_ALIAS_OF[alias] = {};
        }
        IS_ALIAS_OF[alias][type.prototype.type] = true;
        Node.registerType(alias);
    }
}

export function type(Type, type: String) {
    Type.prototype.type = type;
    TYPE_MAP[type] = Type;

    Node.registerType(type);
}

export class Fragment extends Node {
    constructor(expression: Node) {
        super();
        this.value = expression;
    }
}
type(Fragment, 'Fragment');
alias(Fragment, 'Statement');
visitor(Fragment, 'value');

export class PrintExpressionStatement extends Node {
    constructor(expression: Node) {
        super();
        this.value = expression;
    }
}
type(PrintExpressionStatement, 'PrintExpressionStatement');
alias(PrintExpressionStatement, 'Statement', 'PrintStatement');
visitor(PrintExpressionStatement, 'value');

export class PrintTextStatement extends Node {
    constructor(text: StringLiteral) {
        super();
        this.value = text;
    }
}
type(PrintTextStatement, 'PrintTextStatement');
alias(PrintTextStatement, 'Statement', 'PrintStatement');
visitor(PrintTextStatement, 'value');

export class ConstantValue extends Node {
    constructor(value) {
        super();
        this.value = value;
    }

    toString() {
        return `Const(${this.value})`;
    }
}
type(ConstantValue, 'ConstantValue');
alias(ConstantValue, 'Expression', 'Literal', 'Immutable');

export class StringLiteral extends ConstantValue {}
type(StringLiteral, 'StringLiteral');
alias(StringLiteral, 'Expression', 'Literal', 'Immutable');

export class NumericLiteral extends ConstantValue {}
type(NumericLiteral, 'NumericLiteral');
alias(NumericLiteral, 'Expression', 'Literal', 'Immutable');

export class BooleanLiteral extends ConstantValue {
    constructor(value) {
        super(value);
    }
}
type(BooleanLiteral, 'BooleanLiteral');
alias(BooleanLiteral, 'Expression', 'Literal', 'Immutable');

export class NullLiteral extends ConstantValue {
    constructor() {
        super(null);
    }
}
type(NullLiteral, 'NullLiteral');
alias(NullLiteral, 'Expression', 'Literal', 'Immutable');

export class Identifier extends Node {
    constructor(name) {
        super();
        this.name = name;
    }
}
type(Identifier, 'Identifier');
alias(Identifier, 'Expression');

export class UnaryExpression extends Node {
    constructor(operator: String, argument: Node) {
        super();
        this.operator = operator;
        this.argument = argument;
    }
}
type(UnaryExpression, 'UnaryExpression');
alias(UnaryExpression, 'Expression', 'UnaryLike');
visitor(UnaryExpression, 'argument');

export class BinaryExpression extends Node {
    constructor(operator: String, left: Node, right: Node) {
        super();
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}
type(BinaryExpression, 'BinaryExpression');
alias(BinaryExpression, 'Binary', 'Expression');
visitor(BinaryExpression, 'left', 'right');

export class BinaryConcatExpression extends BinaryExpression {
    constructor(left: Node, right: Node) {
        super('~', left, right);
        this.wasImplicitConcatenation = false;
    }
}
type(BinaryConcatExpression, 'BinaryConcatExpression');
alias(BinaryConcatExpression, 'BinaryExpression', 'Binary', 'Expression');
visitor(BinaryConcatExpression, 'left', 'right');

export class ConditionalExpression extends Node {
    constructor(test: Node, consequent: Node, alternate: Node) {
        super();
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
}
type(ConditionalExpression, 'ConditionalExpression');
alias(ConditionalExpression, 'Expression', 'Conditional');
visitor(ConditionalExpression, 'test', 'consequent', 'alternate');

export class ArrayExpression extends Node {
    constructor(elements = []) {
        super();
        this.elements = elements;
    }
}
type(ArrayExpression, 'ArrayExpression');
alias(ArrayExpression, 'Expression');
visitor(ArrayExpression, 'elements');

export class MemberExpression extends Node {
    constructor(object: Node, property: Node, computed: boolean) {
        super();
        this.object = object;
        this.property = property;
        this.computed = computed;
    }
}
type(MemberExpression, 'MemberExpression');
alias(MemberExpression, 'Expression', 'LVal');
visitor(MemberExpression, 'object', 'property');

export class CallExpression extends Node {
    constructor(callee: Node, args: Array<Node>) {
        super();
        this.callee = callee;
        this.arguments = args;
    }
}
type(CallExpression, 'CallExpression');
alias(CallExpression, 'Expression', 'FunctionInvocation');
visitor(CallExpression, 'callee', 'arguments');

export class NamedArgumentExpression extends Node {
    constructor(name: Identifier, value: Node) {
        super();
        this.name = name;
        this.value = value;
    }
}
type(NamedArgumentExpression, 'NamedArgumentExpression');
alias(NamedArgumentExpression, 'Expression');
visitor(NamedArgumentExpression, 'name', 'value');

export class ObjectExpression extends Node {
    constructor(properties: Array<ObjectProperty> = []) {
        super();
        this.properties = properties;
    }
}
type(ObjectExpression, 'ObjectExpression');
alias(ObjectExpression, 'Expression');
visitor(ObjectExpression, 'properties');

export class ObjectProperty extends Node {
    constructor(key: Node, value: Node, computed: boolean) {
        super();
        this.key = key;
        this.value = value;
        this.computed = computed;
    }
}
type(ObjectProperty, 'ObjectProperty');
alias(ObjectProperty, 'Property', 'ObjectMember');
visitor(ObjectProperty, 'key', 'value');

export class SequenceExpression extends Node {
    constructor(expressions: Array<Node> = []) {
        super();
        this.expressions = expressions;
    }

    add(child: Node) {
        this.expressions.push(child);
        this.loc.end = child.loc.end;
    }
}
type(SequenceExpression, 'SequenceExpression');
alias(SequenceExpression, 'Expression', 'Scope');
visitor(SequenceExpression, 'expressions');

export class SliceExpression extends Node {
    constructor(target: Node, start: Node, end: Node) {
        super();
        this.target = target;
        this.start = start;
        this.end = end;
    }
}
type(SliceExpression, 'SliceExpression');
alias(SliceExpression, 'Expression');
visitor(SliceExpression, 'source', 'start', 'end');

export class FilterExpression extends Node {
    constructor(target: Node, name: Identifier, args: Array<Node>) {
        super();
        this.target = target;
        this.name = name;
        this.arguments = args;
    }
}
type(FilterExpression, 'FilterExpression');
alias(FilterExpression, 'Expression');
visitor(FilterExpression, 'target', 'arguments');

export class Element extends Node {
    constructor(name: String) {
        super();
        this.name = name;
        this.attributes = [];
        this.children = [];
        this.selfClosing = false;
    }
}
type(Element, 'Element');
alias(Element, 'Expression');
visitor(Element, 'attributes', 'children');

export class Attribute extends Node {
    constructor(name: Node, value: Node = null) {
        super();
        this.name = name;
        this.value = value;
    }

    isImmutable() {
        return is(this.name, 'Identifier') && is(this.value, 'Immutable');
    }
}
type(Attribute, 'Attribute');
visitor(Attribute, 'name', 'value');

export class TwigComment extends Node {
    constructor(text: StringLiteral) {
        super();
        this.value = text;
    }
}
type(TwigComment, 'TwigComment');
visitor(TwigComment, 'value');

export class HtmlComment extends Node {
    constructor(text: StringLiteral) {
        super();
        this.value = text;
    }
}
type(HtmlComment, 'HtmlComment');
visitor(HtmlComment, 'value');

export class Declaration extends Node {
    constructor(declarationType: String) {
        super();
        this.declarationType = declarationType;
        this.parts = [];
    }
}
type(Declaration, 'Declaration');
visitor(Declaration, 'parts');

export class GenericTwigTag extends Node {
    constructor(tagName: String) {
        super();
        this.tagName = tagName;
        this.parts = [];
        this.sections = [];
    }
}
type(GenericTwigTag, 'GenericTwigTag');

export class GenericToken extends Node {
    constructor(tokenType: String, tokenText: String) {
        super();
        this.tokenType = tokenType;
        this.tokenText = tokenText;
    }
}
type(GenericToken, 'GenericToken');
