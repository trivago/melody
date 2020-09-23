import template from './item.twig';
import { createComponent, RECEIVE_PROPS } from 'melody-component';
import { withRefs } from 'melody-hoc';

const reducer = (state = { clicked: false, id: -1, name: '' }, action) => {
    switch (action.type) {
        case RECEIVE_PROPS:
            return Object.assign(
                {
                    clicked: false,
                },
                state,
                action.payload
            );
        case 'CLICKED':
            return Object.assign({}, state, { clicked: true });
    }
};

const refsEnhancer = withRefs(component => {
    return {
        clickRef: clickRef.bind(component),
    };
});
export const clickRef = function(el) {
    const handler = () => {
        this.dispatch({
            type: 'CLICKED',
            payload: true,
        });
    };
    el.addEventListener('click', handler);
    return {
        unsubscribe() {
            el.removeEventListener('click', handler);
        },
    };
};

export default refsEnhancer(createComponent(template, reducer, {}));
