import List from './__fixtures__/list.js';
import Item from './__fixtures__/item.js';
import { render } from '../src';
import { RECEIVE_PROPS } from 'melody-component';

describe('Full rendering', () => {
    const initialProps = {
        items: [{ id: 1, name: 'Foo' }, { id: 2, name: 'Bar' }],
    };

    it('should return serialized object from debug', () => {
        const result = render(List, initialProps);
        expect(result.debug()).toMatchSnapshot();
    });

    it('should render the entire component', () => {
        const result = render(List, initialProps);
        expect(result).toMatchSnapshot();
    });

    it('should find the child Components', () => {
        const result = render(List, initialProps);
        const x = result.find(Item);
        expect(x).toMatchSnapshot();
    });

    it('should get the props of a single component', () => {
        const result = render(List, initialProps);
        const x = result.find(Item).first();
        expect(x.props()).toMatchSnapshot();
    });

    it('should get the state of a single component', () => {
        const result = render(List, initialProps);
        const x = result.find(Item).first();
        expect(x.state()).toMatchSnapshot();
    });

    it('should allow dispatching actions', () => {
        const result = render(List, initialProps);
        const newProps = {
            items: [...initialProps.items, { id: 3, name: 'Baz' }],
        };
        result.dispatch({ type: RECEIVE_PROPS, payload: newProps });
        const x = result.find(Item);
        expect(x).toMatchSnapshot();
    });

    it('should allow setting props and rerender', () => {
        const result = render(List, initialProps);
        const newProps = {
            items: [...initialProps.items, { id: 3, name: 'Baz' }],
        };
        expect(result).toMatchSnapshot();
        result.setProps(newProps);
        expect(result).toMatchSnapshot();
    });

    it('should render child components when their props are set', () => {
        const result = render(List, initialProps);
        result
            .find(Item)
            .at(1)
            .setProps({
                id: 2,
                name: 'Hello World',
            });
        expect(result).toMatchSnapshot();
    });

    it('should return the first', () => {
        const result = render(List, initialProps);
        expect(
            result
                .find(Item)
                .first()
                .props().id
        ).toEqual(1);
    });

    it('should return the prop value', () => {
        const result = render(List, initialProps);
        expect(
            result
                .find(Item)
                .first()
                .prop('id')
        ).toEqual(1);
    });

    it('should allow querying using CSS selectors', () => {
        const result = render(List, initialProps);
        expect(result.find('li > h2')).toMatchSnapshot();
    });

    it('should allow simulating events', () => {
        const result = render(List, initialProps);
        expect(
            result
                .find(Item)
                .at(0)
                .simulate('click')
                .text()
        ).toMatch(/I have been clicked!/);
        expect(result).toMatchSnapshot();
        expect(result.find(Item).html()).toMatchSnapshot();
    });

    it('should return whether an element has a class or not', () => {
        const result = render(List, initialProps);
        // throws because we didn't find any
        expect(() => result.find('.message').hasClass('message')).toThrow();
        result
            .find(Item)
            .at(0)
            .simulate('click');
        expect(result.find('ul > li > div').hasClass('message')).toBe(true);
    });
});
