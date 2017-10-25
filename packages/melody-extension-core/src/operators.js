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
    BinaryExpression,
    BinaryConcatExpression,
    UnaryExpression,
    type,
    alias,
    visitor,
} from 'melody-types';
import {
    Types,
    setStartFromToken,
    setEndFromToken,
    copyStart,
    copyEnd,
    copyLoc,
    LEFT,
} from 'melody-parser';

export const unaryOperators = [];
export const binaryOperators = [];
export const tests = [];

//region Unary Expressions
export const UnaryNotExpression = createUnaryOperator(
    'not',
    'UnaryNotExpression',
    50
);
export const UnaryNeqExpression = createUnaryOperator(
    '-',
    'UnaryNeqExpression',
    500
);
export const UnaryPosExpression = createUnaryOperator(
    '+',
    'UnaryPosExpression',
    500
);
//endregion

//region Binary Expressions
export const BinaryOrExpression = createBinaryOperatorNode({
    text: 'or',
    type: 'BinaryOrExpression',
    precedence: 10,
    associativity: LEFT,
});
export const BinaryAndExpression = createBinaryOperatorNode({
    text: 'and',
    type: 'BinaryAndExpression',
    precedence: 15,
    associativity: LEFT,
});

export const BitwiseOrExpression = createBinaryOperatorNode({
    text: 'b-or',
    type: 'BitwiseOrExpression',
    precedence: 16,
    associativity: LEFT,
});
export const BitwiseXorExpression = createBinaryOperatorNode({
    text: 'b-xor',
    type: 'BitwiseXOrExpression',
    precedence: 17,
    associativity: LEFT,
});
export const BitwiseAndExpression = createBinaryOperatorNode({
    text: 'b-and',
    type: 'BitwiseAndExpression',
    precedence: 18,
    associativity: LEFT,
});

export const BinaryEqualsExpression = createBinaryOperatorNode({
    text: '==',
    type: 'BinaryEqualsExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryNotEqualsExpression = createBinaryOperatorNode({
    text: '!=',
    type: 'BinaryNotEqualsExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryLessThanExpression = createBinaryOperatorNode({
    text: '<',
    type: 'BinaryLessThanExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryGreaterThanExpression = createBinaryOperatorNode({
    text: '>',
    type: 'BinaryGreaterThanExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryLessThanOrEqualExpression = createBinaryOperatorNode({
    text: '<=',
    type: 'BinaryLessThanOrEqualExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryGreaterThanOrEqualExpression = createBinaryOperatorNode({
    text: '>=',
    type: 'BinaryGreaterThanOrEqualExpression',
    precedence: 20,
    associativity: LEFT,
});

export const BinaryNotInExpression = createBinaryOperatorNode({
    text: 'not in',
    type: 'BinaryNotInExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryInExpression = createBinaryOperatorNode({
    text: 'in',
    type: 'BinaryInExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryMatchesExpression = createBinaryOperatorNode({
    text: 'matches',
    type: 'BinaryMatchesExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryStartsWithExpression = createBinaryOperatorNode({
    text: 'starts with',
    type: 'BinaryStartsWithExpression',
    precedence: 20,
    associativity: LEFT,
});
export const BinaryEndsWithExpression = createBinaryOperatorNode({
    text: 'ends with',
    type: 'BinaryEndsWithExpression',
    precedence: 20,
    associativity: LEFT,
});

export const BinaryRangeExpression = createBinaryOperatorNode({
    text: '..',
    type: 'BinaryRangeExpression',
    precedence: 25,
    associativity: LEFT,
});

export const BinaryAddExpression = createBinaryOperatorNode({
    text: '+',
    type: 'BinaryAddExpression',
    precedence: 30,
    associativity: LEFT,
});
export const BinarySubExpression = createBinaryOperatorNode({
    text: '-',
    type: 'BinarySubExpression',
    precedence: 30,
    associativity: LEFT,
});
binaryOperators.push({
    text: '~',
    precedence: 40,
    associativity: LEFT,
    createNode(token, lhs, rhs) {
        const op = new BinaryConcatExpression(lhs, rhs);
        copyStart(op, lhs);
        copyEnd(op, rhs);
        return op;
    },
});
export const BinaryMulExpression = createBinaryOperatorNode({
    text: '*',
    type: 'BinaryMulExpression',
    precedence: 60,
    associativity: LEFT,
});
export const BinaryDivExpression = createBinaryOperatorNode({
    text: '/',
    type: 'BinaryDivExpression',
    precedence: 60,
    associativity: LEFT,
});
export const BinaryFloorDivExpression = createBinaryOperatorNode({
    text: '//',
    type: 'BinaryFloorDivExpression',
    precedence: 60,
    associativity: LEFT,
});
export const BinaryModExpression = createBinaryOperatorNode({
    text: '%',
    type: 'BinaryModExpression',
    precedence: 60,
    associativity: LEFT,
});

binaryOperators.push({
    text: 'is',
    precedence: 100,
    associativity: LEFT,
    parse(parser, token, expr) {
        const tokens = parser.tokens;

        let not = false;
        if (tokens.nextIf(Types.OPERATOR, 'not')) {
            not = true;
        }

        const test = getTest(parser);
        let args = null;
        if (tokens.test(Types.LPAREN)) {
            args = parser.matchArguments();
        }
        const testExpression = test.createNode(expr, args);
        setStartFromToken(testExpression, token);
        setEndFromToken(testExpression, tokens.la(-1));
        if (not) {
            return copyLoc(
                new UnaryNotExpression(testExpression),
                testExpression
            );
        }
        return testExpression;
    },
});

function getTest(parser) {
    const tokens = parser.tokens;
    const nameToken = tokens.la(0);
    if (nameToken.type !== Types.NULL) {
        tokens.expect(Types.SYMBOL);
    } else {
        tokens.next();
    }
    let testName = nameToken.text;
    if (!parser.hasTest(testName)) {
        // try 2-words tests
        const continuedNameToken = tokens.expect(Types.SYMBOL);
        testName += ' ' + continuedNameToken.text;
        if (!parser.hasTest(testName)) {
            parser.error({
                title: `Unknown test "${testName}"`,
                pos: nameToken.pos,
            });
        }
    }

    return parser.getTest(testName);
}

export const BinaryPowerExpression = createBinaryOperatorNode({
    text: '**',
    type: 'BinaryPowerExpression',
    precedence: 200,
    associativity: LEFT,
});
export const BinaryNullCoalesceExpression = createBinaryOperatorNode({
    text: '??',
    type: 'BinaryNullCoalesceExpression',
    precedence: 300,
    associativity: LEFT,
});
//endregion

//region Test Expressions
export const TestEvenExpression = createTest('even', 'TestEvenExpression');
export const TestOddExpression = createTest('odd', 'TestOddExpression');
export const TestDefinedExpression = createTest(
    'defined',
    'TestDefinedExpression'
);
export const TestSameAsExpression = createTest(
    'same as',
    'TestSameAsExpression'
);
tests.push({
    text: 'sameas',
    createNode(expr, args) {
        // todo: add deprecation warning
        return new TestSameAsExpression(expr, args);
    },
});
export const TestNullExpression = createTest('null', 'TestNullExpression');
tests.push({
    text: 'none',
    createNode(expr, args) {
        return new TestNullExpression(expr, args);
    },
});
export const TestDivisibleByExpression = createTest(
    'divisible by',
    'TestDivisibleByExpression'
);
tests.push({
    text: 'divisibleby',
    createNode(expr, args) {
        // todo: add deprecation warning
        return new TestDivisibleByExpression(expr, args);
    },
});
export const TestConstantExpression = createTest(
    'constant',
    'TestConstantExpression'
);
export const TestEmptyExpression = createTest('empty', 'TestEmptyExpression');
export const TestIterableExpression = createTest(
    'iterable',
    'TestIterableExpression'
);
//endregion

//region Utilities
function createTest(text, typeName) {
    const TestExpression = class extends Node {
        constructor(expr: Node, args?: Array<Node>) {
            super();
            this.expression = expr;
            this.arguments = args;
        }
    };
    type(TestExpression, typeName);
    alias(TestExpression, 'Expression', 'TestExpression');
    visitor(TestExpression, 'expression', 'arguments');

    tests.push({
        text,
        createNode(expr, args) {
            return new TestExpression(expr, args);
        },
    });

    return TestExpression;
}

function createBinaryOperatorNode(options) {
    const { text, precedence, associativity } = options;
    const BinarySubclass = class extends BinaryExpression {
        constructor(left: Node, right: Node) {
            super(text, left, right);
        }
    };
    type(BinarySubclass, options.type);
    alias(BinarySubclass, 'BinaryExpression', 'Binary', 'Expression');
    visitor(BinarySubclass, 'left', 'right');

    const operator = {
        text,
        precedence,
        associativity,
    };
    if (options.parse) {
        operator.parse = options.parse;
    } else if (options.createNode) {
        operator.createNode = options.createNode;
    } else {
        operator.createNode = (token, lhs, rhs) => new BinarySubclass(lhs, rhs);
    }
    binaryOperators.push(operator);

    return BinarySubclass;
}

function createUnaryOperator(operator, typeName, precedence) {
    const UnarySubclass = class extends UnaryExpression {
        constructor(argument: Node) {
            super(operator, argument);
        }
    };
    type(UnarySubclass, typeName);
    alias(UnarySubclass, 'Expression', 'UnaryLike');
    visitor(UnarySubclass, 'argument');

    unaryOperators.push({
        text: operator,
        precedence,
        createNode(token, expr) {
            const op = new UnarySubclass(expr);
            setStartFromToken(op, token);
            copyEnd(op, expr);
            return op;
        },
    });

    return UnarySubclass;
}
//endregion
