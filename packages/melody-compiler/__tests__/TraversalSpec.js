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
import { expect } from 'chai';
import { parse } from 'melody-parser';
import { traverse, merge } from 'melody-traverse';
import * as n from 'melody-types';

describe('Traversal', function() {
    describe('when visiting', function() {
        it('will visit all nodes', function() {
            let node = parse`{{ " foo #{bar} " }}`,
                concats = 0,
                stringLiterals = 0,
                identifiers = 0;
            traverse(node, {
                BinaryConcatExpression(path) {
                    switch (concats) {
                        case 0:
                            expect(path.node.right.value).to.equal(' ');
                            break;
                        case 1:
                            expect(path.node.right.name).to.equal('bar');
                            break;
                    }
                    concats++;
                },
                StringLiteral(path) {
                    switch (stringLiterals) {
                        case 0:
                            expect(path.node.value).to.equal(' foo ');
                            break;
                        case 1:
                            expect(path.node.value).to.equal(' ');
                            break;
                    }
                    stringLiterals++;
                },
                Identifier(path) {
                    if (identifiers === 0) {
                        expect(path.node.name).to.equal('bar');
                    }
                    identifiers++;
                },
            });
            expect(concats).to.equal(2);
            expect(stringLiterals).to.equal(2);
            expect(identifiers).to.equal(1);
        });
    });

    describe('when replacing', function() {
        it('will replace a given node', function() {
            let node = parse`{{ " foo #{bar} #{baz}" }}`;
            traverse(node, {
                Identifier(path) {
                    if (path.node.name === 'bar') {
                        path.replaceWith(new n.Identifier('foo'));
                    }
                },
            });
            expect(node.expressions[0].value.left.left.right.name).to.equal(
                'foo',
            );
            expect(node.expressions[0].value.right.name).to.equal('baz');
        });
    });

    describe('when merging visitors', function() {
        it('will replace a given node', function() {
            let node = parse`{{ " foo #{bar} #{baz}" }}`;
            const replacer = {
                Identifier(path) {
                    if (path.node.name === 'bar') {
                        path.replaceWith(new n.Identifier('foo'));
                    }
                },
            };
            const count = {};
            const counter = {
                Identifier(path) {
                    count[path.node.name] = (count[path.node.name] || 0) + 1;
                },
            };
            const visitor = merge(counter, replacer);
            traverse(node, visitor);
            expect(node.expressions[0].value.left.left.right.name).to.equal(
                'foo',
            );
            expect(node.expressions[0].value.right.name).to.equal('baz');
            expect(count.bar).to.equal(1);
            expect(count.baz).to.equal(1);
            expect(count.foo).to.equal(1);
        });
    });
});
