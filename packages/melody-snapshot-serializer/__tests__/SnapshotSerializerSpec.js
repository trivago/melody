import { getNodeData } from 'melody-idom';
import { Wrapper } from 'melody-test-utils';
import { test, print } from '../src';

describe('Snapshot serializer', () => {
    let prettyFormat;
    let indent;
    beforeEach(() => {
        prettyFormat = jest.fn(x => JSON.stringify(x));
        indent = jest.fn(x => '  ' + x);
    });

    it('should identify a Wrapper', () => {
        const el = document.createElement('el');
        const wrapper = new Wrapper(el);
        expect(test(wrapper)).toEqual(true);
    });

    it('should print without array when wrapping a single element', () => {
        const el = document.createElement('el');
        const wrapper = new Wrapper(el);
        print(wrapper, prettyFormat, indent);
        expect(prettyFormat).toHaveBeenCalledWith(wrapper.elements[0]);
    });

    it('should print an array when wrapping multiple elements', () => {
        const el = document.createElement('el');
        const el2 = document.createElement('el');
        const wrapper = new Wrapper([el, el2]);
        print(wrapper, prettyFormat, indent);
        expect(prettyFormat).toHaveBeenCalledWith(wrapper.elements);
    });

    it('should print shallow components', () => {
        const el = document.createElement('m-placeholder');
        getNodeData(el).componentInstance = {
            displayName: 'TestComponent',
            props: {},
        };
        expect(print(el, prettyFormat, indent)).toMatchSnapshot();
    });

    it('should print shallow components with props', () => {
        const el = document.createElement('m-placeholder');
        getNodeData(el).componentInstance = {
            displayName: 'TestComponent',
            props: {
                test: 1,
                foo: 'bar',
                baz: { hello: 'world' },
            },
        };
        expect(print(el, prettyFormat, indent)).toMatchSnapshot();
    });
});
