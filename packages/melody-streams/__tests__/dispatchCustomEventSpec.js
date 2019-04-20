import { elementOpen, elementClose } from 'melody-idom';

import { createComponent, render } from '../src';

import { first, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

describe('dispatchCustomEvent', () => {
    it(`dispatches custom event properly`, done => {
        const root = document.createElement('div');
        const eventListenerCallback = jest.fn(() => done());

        root.addEventListener('myCustomEvent', eventListenerCallback);

        const template = {
            render() {
                elementOpen('div', null, null);
                elementClose('div');
            },
        };

        const C = ({ props, updates, subscribe, dispatchCustomEvent }) => {
            subscribe(
                updates.pipe(
                    first(),
                    tap(() => {
                        dispatchCustomEvent('myCustomEvent');
                    }),
                    catchError(err => {
                        done(err);
                        return of(err);
                    })
                )
            );

            return props;
        };

        const TestComponent = createComponent(C, template);
        render(root, TestComponent);

        expect(eventListenerCallback).toHaveBeenCalledTimes(1);
    });
});
