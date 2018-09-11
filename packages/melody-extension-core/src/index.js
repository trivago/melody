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
import { unaryOperators, binaryOperators, tests } from './operators';
import { AutoescapeParser } from './parser/autoescape';
import { BlockParser } from './parser/block';
import { DoParser } from './parser/do';
import { EmbedParser } from './parser/embed';
import { ExtendsParser } from './parser/extends';
import { FilterParser } from './parser/filter';
import { FlushParser } from './parser/flush';
import { ForParser } from './parser/for';
import { FromParser } from './parser/from';
import { IfParser } from './parser/if';
import { ImportParser } from './parser/import';
import { IncludeParser } from './parser/include';
import { MacroParser } from './parser/macro';
import { SetParser } from './parser/set';
import { SpacelessParser } from './parser/spaceless';
import { UseParser } from './parser/use';
import { MountParser } from './parser/mount';

import forVisitor from './visitors/for';
import testVisitor from './visitors/tests';
import filters from './visitors/filters';
import functions from './visitors/functions';

const filterMap = [
    'attrs',
    'classes',
    'styles',
    'batch',
    'escape',
    'format',
    'merge',
    'nl2br',
    'number_format',
    'raw',
    'replace',
    'reverse',
    'round',
    'striptags',
    'title',
    'url_encode',
    'trim',
].reduce((map, filterName) => {
    map[filterName] = 'melody-runtime';
    return map;
}, Object.create(null));

Object.assign(filterMap, filters);

const functionMap = [
    'attribute',
    'constant',
    'cycle',
    'date',
    'max',
    'min',
    'random',
    'range',
    'source',
    'template_from_string',
].reduce((map, functionName) => {
    map[functionName] = 'melody-runtime';
    return map;
}, Object.create(null));
Object.assign(functionMap, functions);

export const extension = {
    tags: [
        AutoescapeParser,
        BlockParser,
        DoParser,
        EmbedParser,
        ExtendsParser,
        FilterParser,
        FlushParser,
        ForParser,
        FromParser,
        IfParser,
        ImportParser,
        IncludeParser,
        MacroParser,
        SetParser,
        SpacelessParser,
        UseParser,
        MountParser,
    ],
    unaryOperators,
    binaryOperators,
    tests,
    visitors: [forVisitor, testVisitor],
    filterMap,
    functionMap,
};

export {
    AutoescapeBlock,
    BlockStatement,
    BlockCallExpression,
    MountStatement,
    DoStatement,
    EmbedStatement,
    ExtendsStatement,
    FilterBlockStatement,
    FlushStatement,
    ForStatement,
    ImportDeclaration,
    FromStatement,
    IfStatement,
    IncludeStatement,
    MacroDeclarationStatement,
    VariableDeclarationStatement,
    SetStatement,
    SpacelessBlock,
    AliasExpression,
    UseStatement,
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
} from './types';
