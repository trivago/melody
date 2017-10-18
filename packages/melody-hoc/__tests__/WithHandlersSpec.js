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
import { createComponent, render } from 'melody-component';
import { elementOpen, elementClose, elementVoid } from 'melody-idom';
import withHandlers from '../src/withHandlers';

const template = {
    render(props) {
        elementOpen('button', null, ['onclick', props.onClick]);
        elementVoid('input', null, ['onchange', props.onChange]);
        elementClose('button');
    },
};

describe('WithHandlers', () => {
    it('should map handlers', () => {
        const root = document.createElement('button');
        let props = null;

        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                props = this.props;
            },
        });

        const eventResults = {};

        const enhance = withHandlers({
            onClick: props => event => {
                eventResults.onClick = { props, event };
            },
            onChange: props => event => {
                eventResults.onChange = { props, event };
            },
        });

        const EnhancedComponent = enhance(MyComponent);

        render(root, EnhancedComponent, { foo: 'bar' });

        expect(props.onClick).toBeInstanceOf(Function);
        expect(props.onChange).toBeInstanceOf(Function);

        const assertProps = (handler, fooValue, event) => {
            props[handler](event);

            const r = eventResults[handler];
            expect(r.event).toEqual(event);
            expect(r.props).toBeTruthy();
            expect(r.props.foo).toEqual(fooValue);
        };

        assertProps('onClick', 'bar', { type: 'click', id: 0 });
        assertProps('onChange', 'bar', { type: 'change', id: 1 });

        render(root, EnhancedComponent, { foo: 'quu' });

        assertProps('onClick', 'quu', { type: 'click', id: 2 });
        assertProps('onChange', 'quu', { type: 'change', id: 3 });
    });

    it('should not modify handler props', () => {
        const root = document.createElement('button');
        let props = null;

        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                props = this.props;
            },
        });

        const enhance = withHandlers({
            handler: props => event => null,
        });

        const EnhancedComponent = enhance(MyComponent);

        render(root, EnhancedComponent, { foo: 'bar' });
        const firstProps = props;

        render(root, EnhancedComponent, { foo: 'bar' });
        const secondProps = props;

        expect(firstProps.handler).toBeTruthy();
        expect(firstProps.handler).toEqual(secondProps.handler);
    });

    it('should cache handlers', () => {
        const root = document.createElement('button');
        let props = null;

        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                props = this.props;
            },
        });

        let count = 0;
        let triggerCount = 0;
        const enhance = withHandlers({
            handler: props => {
                count++;
                return event => triggerCount++;
            },
        });

        const EnhancedComponent = enhance(MyComponent);

        // Don't create handler until it is called
        render(root, EnhancedComponent, { foo: 'bar' });
        expect(count).toEqual(0);
        expect(triggerCount).toEqual(0);

        props.handler();
        expect(count).toEqual(1);
        expect(triggerCount).toEqual(1);

        // Props haven't changed; should use cached handler
        props.handler();
        expect(count).toEqual(1);
        expect(triggerCount).toEqual(2);

        render(root, EnhancedComponent, { foo: 'quu' });
        props.handler();
        // Props did change; handler should be recreated
        expect(count).toEqual(2);
        expect(triggerCount).toEqual(3);
    });

    it('should warn if handler is not a higher order function', () => {
        const root = document.createElement('button');
        let props = null;

        const MyComponent = createComponent(template, undefined, {
            componentDidMount() {
                props = this.props;
            },
        });

        const oldError = console.error;
        console.error = jest.fn();

        const enhance = withHandlers({
            handler: props => {},
        });

        const EnhancedComponent = enhance(MyComponent);

        // Don't create handler until it is called
        render(root, EnhancedComponent, { foo: 'bar' });
        expect(() => props.handler()).toThrow();
        expect(console.error).toHaveBeenCalledWith(
            'withHandlers(): Expected a map of higher-order functions. Refer to the docs for more info.',
        );
        console.error = oldError;
    });
});
