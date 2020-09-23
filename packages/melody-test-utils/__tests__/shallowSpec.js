import List from './__fixtures__/list.js';
import Item, { clickRef as refFn } from './__fixtures__/item.js';
import Child from './__fixtures__/child.js';
import { shallow } from '../src';
import { RECEIVE_PROPS } from 'melody-component';

describe('Shallow rendering', () => {
    const initialProps = {
        items: [{ id: 1, name: 'Foo' }, { id: 2, name: 'Bar' }],
    };

    it('should return serialized object from debug', () => {
        const result = shallow(List, initialProps);
        expect(result.debug()).toMatchSnapshot();
    });

    it('should only render the top-level component', () => {
        const result = shallow(List, initialProps);
        expect(result).toMatchSnapshot();
    });

    it('should find the child Components', () => {
        const result = shallow(List, initialProps);
        const x = result.find(Item);
        expect(x).toMatchSnapshot();
    });

    it("should throw when find selectors don't match anything", () => {
        const result = shallow(Item, initialProps);
        expect(() => {
            result.find('xxx');
        }).toThrow(/^Couldn't find component with selector: xxx/);
    });

    it("should throw when find selectors don't match anything", () => {
        const result = shallow(Item, initialProps);
        expect(() => {
            result.find(List);
        }).toThrow(/^Couldn't find component with selector: List/);
    });

    it('should throw when find selectors are not a string or function', () => {
        const result = shallow(Item, initialProps);
        expect(() => {
            result.find();
        }).toThrow(/^Your selector is invalid: /);
        expect(() => {
            result.find({});
        }).toThrow(/^Your selector is invalid: /);
        expect(() => {
            result.find(123);
        }).toThrow(/^Your selector is invalid: /);
    });

    it('should get the props of a single component', () => {
        const result = shallow(List, initialProps);
        const x = result.find(Item).first();
        expect(x.props()).toMatchSnapshot();
    });

    it('should get the state of a single component', () => {
        const result = shallow(List, initialProps);
        const x = result.find(Item).first();
        expect(x.state()).toMatchSnapshot();
    });

    it('should allow dispatching actions', () => {
        const result = shallow(List, initialProps);
        const newProps = {
            items: [...initialProps.items, { id: 3, name: 'Baz' }],
        };
        result.dispatch({ type: RECEIVE_PROPS, payload: newProps });
        const x = result.find(Item);
        expect(x).toMatchSnapshot();
    });

    it('should allow setting props and rerender shallowly', () => {
        const result = shallow(List, initialProps);
        const newProps = {
            items: [...initialProps.items, { id: 3, name: 'Baz' }],
        };
        result.setProps(newProps);
        expect(result).toMatchSnapshot();
    });

    it('should allow filtering wrappers', () => {
        const result = shallow(List, {
            items: [...initialProps.items, { id: 3, name: 'Baz' }],
        });
        expect(
            result.find(Item).filterWhere(item => item.prop('id') !== 1)
        ).toMatchSnapshot();
    });

    it('should allow finding with a predicate function', () => {
        const result = shallow(List, initialProps);
        expect(
            result.findWhere(x => x.is(Item) || x.is(Child))
        ).toMatchSnapshot();
    });

    it('should allow filtering with a selector function', () => {
        const result = shallow(List, initialProps);
        expect(
            result.findWhere(x => x.is(Item) || x.is(Child)).filter(Child)
        ).toMatchSnapshot();
    });

    it('should unfold child components when their props are set', () => {
        const result = shallow(List, initialProps);
        result
            .find(Item)
            .at(1)
            .setProps({
                id: 2,
                name: 'Hello World',
            });
        expect(result).toMatchSnapshot();
    });

    it('should allow unfolding shallowly rendered children', () => {
        const result = shallow(List, initialProps);
        result
            .find(Item)
            .at(1)
            .render();
        expect(result).toMatchSnapshot();
    });

    it('should allow unfolding shallowly rendered children completely', () => {
        const result = shallow(List, initialProps);
        result.find(Child).render();
        expect(result).toMatchSnapshot();
    });

    it('should allow unfolding shallowly rendered children shallowly', () => {
        const result = shallow(List, initialProps);
        result.find(Child).shallow();
        expect(result).toMatchSnapshot();
    });

    it('should return the first', () => {
        const result = shallow(List, initialProps);
        expect(
            result
                .find(Item)
                .first()
                .props().id
        ).toEqual(1);
    });

    it('should return the prop value', () => {
        const result = shallow(List, initialProps);
        expect(
            result
                .find(Item)
                .first()
                .prop('id')
        ).toEqual(1);
    });
});
