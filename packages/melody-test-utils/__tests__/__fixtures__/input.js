import template from './input.twig';
import { createComponent, RECEIVE_PROPS } from 'melody-component';
import { bindEvents } from 'melody-hoc';

const reducer = (state = { value: 'hello, melody' }, action) => {
    switch (action.type) {
        case RECEIVE_PROPS:
            return {
                ...state,
                ...action.payload,
            };
        case 'CHANGE':
            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
};

const eventEnhancer = bindEvents({
    input: {
        input(event, { dispatch }) {
            dispatch({
                type: 'CHANGE',
                payload: {
                    value: event.target.value,
                },
            });
        },
    },
});

export default eventEnhancer(createComponent(template, reducer, {}));
