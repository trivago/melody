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
    Node,
    Identifier,
    SequenceExpression,
    type,
    alias,
    visitor,
} from 'melody-types';
import type { StringLiteral } from 'melody-types';

export class AutoescapeBlock extends Node {
    constructor(type: String | boolean, expressions?: Array<Node>) {
        super();
        this.escapeType = type;
        this.expressions = expressions;
    }
}
type(AutoescapeBlock, 'AutoescapeBlock');
alias(AutoescapeBlock, 'Block', 'Escape');
visitor(AutoescapeBlock, 'expressions');

export class BlockStatement extends Node {
    constructor(name: Identifier, body: Node) {
        super();
        this.name = name;
        this.body = body;
    }
}
type(BlockStatement, 'BlockStatement');
alias(BlockStatement, 'Statement', 'Scope', 'RootScope');
visitor(BlockStatement, 'body');

export class BlockCallExpression extends Node {
    constructor(callee: StringLiteral, args: Array<Node> = []) {
        super();
        this.callee = callee;
        this.arguments = args;
    }
}
type(BlockCallExpression, 'BlockCallExpression');
alias(BlockCallExpression, 'Expression', 'FunctionInvocation');
visitor(BlockCallExpression, 'arguments');

export class MountStatement extends Node {
    constructor(
        name?: Identifier,
        source?: String,
        key?: Node,
        argument?: Node,
        async?: Boolean,
        delayBy?: Number
    ) {
        super();
        this.name = name;
        this.source = source;
        this.key = key;
        this.argument = argument;
        this.async = async;
        this.delayBy = delayBy;
        this.errorVariableName = null;
        this.body = null;
        this.otherwise = null;
    }
}
type(MountStatement, 'MountStatement');
alias(MountStatement, 'Statement', 'Scope');
visitor(
    MountStatement,
    'name',
    'source',
    'key',
    'argument',
    'body',
    'otherwise'
);

export class DoStatement extends Node {
    constructor(expression: Node) {
        super();
        this.value = expression;
    }
}
type(DoStatement, 'DoStatement');
alias(DoStatement, 'Statement');
visitor(DoStatement, 'value');

export class EmbedStatement extends Node {
    constructor(parent: Node) {
        super();
        this.parent = parent;
        this.argument = null;
        this.contextFree = false;
        // when `true`, missing templates will be ignored
        this.ignoreMissing = false;
        this.blocks = null;
    }
}
type(EmbedStatement, 'EmbedStatement');
alias(EmbedStatement, 'Statement', 'Include');
visitor(EmbedStatement, 'argument', 'blocks');

export class ExtendsStatement extends Node {
    constructor(parentName: Node) {
        super();
        this.parentName = parentName;
    }
}
type(ExtendsStatement, 'ExtendsStatement');
alias(ExtendsStatement, 'Statement', 'Include');
visitor(ExtendsStatement, 'parentName');

export class FilterBlockStatement extends Node {
    constructor(filterExpression: Node, body: Node) {
        super();
        this.filterExpression = filterExpression;
        this.body = body;
    }
}
type(FilterBlockStatement, 'FilterBlockStatement');
alias(FilterBlockStatement, 'Statement', 'Block');
visitor(FilterBlockStatement, 'filterExpression', 'body');

export class FlushStatement extends Node {
    constructor() {
        super();
    }
}
type(FlushStatement, 'FlushStatement');
alias(FlushStatement, 'Statement');

export class ForStatement extends Node {
    constructor(
        keyTarget?: Identifier = null,
        valueTarget?: Identifier = null,
        sequence?: Node = null,
        condition?: Node = null,
        body?: Node = null,
        otherwise?: Node = null
    ) {
        super();
        this.keyTarget = keyTarget;
        this.valueTarget = valueTarget;
        this.sequence = sequence;
        this.condition = condition;
        this.body = body;
        this.otherwise = otherwise;
    }
}
type(ForStatement, 'ForStatement');
alias(ForStatement, 'Statement', 'Scope', 'Loop');
visitor(
    ForStatement,
    'keyTarget',
    'valueTarget',
    'sequence',
    'condition',
    'body',
    'otherwise'
);

export class ImportDeclaration extends Node {
    constructor(key: Node, alias: Identifier) {
        super();
        this.key = key;
        this.alias = alias;
    }
}
type(ImportDeclaration, 'ImportDeclaration');
alias(ImportDeclaration, 'VariableDeclaration');
visitor(ImportDeclaration, 'key', 'value');

export class FromStatement extends Node {
    constructor(source: Node, imports: Array<ImportDeclaration>) {
        super();
        this.source = source;
        this.imports = imports;
    }
}
type(FromStatement, 'FromStatement');
alias(FromStatement, 'Statement');
visitor(FromStatement, 'source', 'imports');

export class IfStatement extends Node {
    constructor(test: Node, consequent?: Node = null, alternate?: Node = null) {
        super();
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
}
type(IfStatement, 'IfStatement');
alias(IfStatement, 'Statement', 'Conditional');
visitor(IfStatement, 'test', 'consequent', 'alternate');

export class IncludeStatement extends Node {
    constructor(source: Node) {
        super();
        this.source = source;
        this.argument = null;
        this.contextFree = false;
        // when `true`, missing templates will be ignored
        this.ignoreMissing = false;
    }
}
type(IncludeStatement, 'IncludeStatement');
alias(IncludeStatement, 'Statement', 'Include');
visitor(IncludeStatement, 'source', 'argument');

export class MacroDeclarationStatement extends Node {
    constructor(name: Identifier, args: Array<Node>, body: SequenceExpression) {
        super();
        this.name = name;
        this.arguments = args;
        this.body = body;
    }
}
type(MacroDeclarationStatement, 'MacroDeclarationStatement');
alias(MacroDeclarationStatement, 'Statement', 'Scope', 'RootScope');
visitor(MacroDeclarationStatement, 'name', 'arguments', 'body');

export class VariableDeclarationStatement extends Node {
    constructor(name: Identifier, value: Node) {
        super();
        this.name = name;
        this.value = value;
    }
}
type(VariableDeclarationStatement, 'VariableDeclarationStatement');
alias(VariableDeclarationStatement, 'Statement');
visitor(VariableDeclarationStatement, 'name', 'value');

export class SetStatement extends Node {
    constructor(assignments: Array<VariableDeclarationStatement>) {
        super();
        this.assignments = assignments;
    }
}
type(SetStatement, 'SetStatement');
alias(SetStatement, 'Statement', 'ContextMutation');
visitor(SetStatement, 'assignments');

export class SpacelessBlock extends Node {
    constructor(body?: Node = null) {
        super();
        this.body = body;
    }
}
type(SpacelessBlock, 'SpacelessBlock');
alias(SpacelessBlock, 'Statement', 'Block');
visitor(SpacelessBlock, 'body');

export class AliasExpression extends Node {
    constructor(name: Identifier, alias: Identifier) {
        super();
        this.name = name;
        this.alias = alias;
    }
}
type(AliasExpression, 'AliasExpression');
alias(AliasExpression, 'Expression');
visitor(AliasExpression, 'name', 'alias');

export class UseStatement extends Node {
    constructor(source: Node, aliases: Array<AliasExpression>) {
        super();
        this.source = source;
        this.aliases = aliases;
    }
}
type(UseStatement, 'UseStatement');
alias(UseStatement, 'Statement', 'Include');
visitor(UseStatement, 'source', 'aliases');

export {
    UnaryNotExpression,
    UnaryNeqExpression,
    UnaryPosExpression,
    BinaryOrExpression,
    BinaryAndExpression,
    BitwiseOrExpression,
    BitwiseXorExpression,
    BitwiseAndExpression,
    BinaryEqualsExpression,
    BinaryNotEqualsExpression,
    BinaryLessThanExpression,
    BinaryGreaterThanExpression,
    BinaryLessThanOrEqualExpression,
    BinaryGreaterThanOrEqualExpression,
    BinaryNotInExpression,
    BinaryInExpression,
    BinaryMatchesExpression,
    BinaryStartsWithExpression,
    BinaryEndsWithExpression,
    BinaryRangeExpression,
    BinaryAddExpression,
    BinaryMulExpression,
    BinaryDivExpression,
    BinaryFloorDivExpression,
    BinaryModExpression,
    BinaryPowerExpression,
    BinaryNullCoalesceExpression,
    TestEvenExpression,
    TestOddExpression,
    TestDefinedExpression,
    TestSameAsExpression,
    TestNullExpression,
    TestDivisibleByExpression,
    TestConstantExpression,
    TestEmptyExpression,
    TestIterableExpression,
} from './operators';
