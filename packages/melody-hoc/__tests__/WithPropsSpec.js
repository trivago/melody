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

import { createComponent, render } from 'melody-component';
import { elementOpen, elementClose } from 'melody-idom';
import { withProps } from '../src';

const template = {
    render(_context) {
        elementOpen('div', null, null);
        elementClose('div');
    },
};

describe('DefaultProps', function() {
    it('should add properties', function() {
        const root = document.createElement('div');
        let loggedProps;
        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                loggedProps = this.props;
            },
        });

        const enhance = withProps({ foo: 'bar', qux: 'qax' });
        const EnhancedComponent = enhance(MyComponent);

        render(root, EnhancedComponent, { foo: 'baz' });
        expect(loggedProps).to.deep.equal({ foo: 'bar', qux: 'qax' });
    });
    it('should add properties on update', function() {
        const root = document.createElement('div');
        let loggedProps;
        const MyComponent = createComponent(template, undefined, {
            componentDidUpdate() {
                loggedProps = this.props;
            },
        });

        const enhance = withProps({ foo: 'bar', qux: 'qax' });
        const EnhancedComponent = enhance(MyComponent);

        render(root, EnhancedComponent, { foo: 'baz' });
        render(root, EnhancedComponent, { doo: 'woo' });
        expect(loggedProps).to.deep.equal({
            foo: 'bar',
            qux: 'qax',
            doo: 'woo',
        });
    });
});
