/**
 * Copyright 2018 trivago N.V.
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
import { assert } from 'chai';

import { render, unmountComponentAtNode } from 'melody-component';
import {
    elementOpen,
    elementClose,
    text,
    component,
    patchOuter,
} from 'melody-idom';
import { createComponent, combine } from '../src';
// import { createComponent, useEffect, useEffectOnce, useState } from '../src';
import { flush } from './util/flush';
import {
    createSubjects,
    next,
    testWith,
    testWithArguments,
} from './util/testHelpers';
import { last } from 'rxjs/operators';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        text(_context.value);
        elementClose('div');
    },
};

describe('component', () => {
    it('createComponent should support currying', () => {
        const template1 = {
            render(_context) {
                elementOpen('div');
                elementOpen('span');
                text(_context.value);
                elementClose('span');
                elementClose('div');
            },
        };
        const template2 = {
            render(_context) {
                elementOpen('div');
                elementOpen('div');
                text(_context.value);
                elementClose('div');
                elementClose('div');
            },
        };
        const createHashtagComponent = createComponent(({ props }) => props);
        const SpanHashtagComponent = createHashtagComponent(template1);
        const DivHashtagComponent = createHashtagComponent(template2);

        const root1 = document.createElement('div');
        render(root1, SpanHashtagComponent, { value: 'foo' });

        const root2 = document.createElement('div');
        render(root2, DivHashtagComponent, { value: 'foo' });
    });
    it('should render when props have changed', () => {
        const root = document.createElement('div');
        const [subj] = createSubjects(1);
        const MyComponent = createComponent(({ props, updates }) => {
            updates.subscribe(...next(subj));
            return props;
        }, template);
        // Snapshot should have 2 entries
        testWithArguments(subj, render, [
            [root, MyComponent, { value: 'foo' }],
            [root, MyComponent, { value: 'bar' }],
        ]);
    });
    it('should not rerender when props have not changed', () => {
        const root = document.createElement('div');
        const [subj] = createSubjects(1);
        const MyComponent = createComponent(({ props, updates }) => {
            updates.subscribe(...next(subj));
            return props;
        }, template);
        // Snapshot should have 1 entry
        testWithArguments(subj, render, [
            [root, MyComponent, { value: 'foo' }],
            [root, MyComponent, { value: 'foo' }],
        ]);
    });
    it("should not rerender children when props haven't changed", () => {
        const childTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                text('Hello');
                elementClose('div');
            },
        };
        const [subj] = createSubjects(1);
        const MyComponent = createComponent(({ props, updates }) => {
            updates.subscribe(...next(subj));
            return props;
        }, childTemplate);

        const parentTemplate = {
            render(_context) {
                elementOpen('div', null, null);
                component(MyComponent, '4');
                elementClose('div');
            },
        };
        const MyParentComponent = createComponent(
            ({ props }) => props,
            parentTemplate
        );

        const root = document.createElement('div');
        // Snapshot should have 1 entry
        testWithArguments(subj, render, [
            [root, MyParentComponent],
            [root, MyParentComponent],
        ]);
    });
    it('should replace components', () => {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const MyComponent = createComponent(({ props }) => props, template);
        const MyOtherComponent = createComponent(
            ({ props }) => props,
            template
        );

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');

        render(root, MyOtherComponent, { text: 'test' });
        assert.equal(root.outerHTML, '<div>test</div>');
    });
    it('should unmount replaced components', () => {
        const template = {
            render(_context) {
                elementOpen('div', 'test', null);
                text(_context.text);
                elementClose('div');
            },
        };
        const root = document.createElement('div');
        const [subj] = createSubjects(1);
        const MyComponent = createComponent(({ props, updates }) => {
            updates.pipe(last()).subscribe(...next(subj));
            return props;
        }, template);
        const MyOtherComponent = createComponent(
            ({ props }) => props,
            template
        );

        render(root, MyComponent, { text: 'hello' });
        assert.equal(root.outerHTML, '<div>hello</div>');
        // Should have 1 entry
        testWithArguments(subj, render, [
            [root, MyOtherComponent, { text: 'test' }],
        ]);
        assert.equal(root.outerHTML, '<div>test</div>');
    });
});
