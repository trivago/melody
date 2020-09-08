import { elementOpen, elementClose, component } from 'melody-idom';

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

    describe('bubbles', () => {
        const createElements = (done, options) => {
            const innerTemplate = {
                render() {
                    elementOpen('div');
                    elementClose('div');
                },
            };

            const InnerComponentFunction = jest.fn(
                ({ props, updates, subscribe, dispatchCustomEvent }) => {
                    subscribe(
                        updates.pipe(
                            first(),
                            tap(() => {
                                dispatchCustomEvent(
                                    'myBubblingEvent',
                                    {},
                                    options
                                );

                                setTimeout(done, 100);
                            }),
                            catchError(err => {
                                done(err);
                                return of(err);
                            })
                        )
                    );

                    return props;
                }
            );

            const InnerComponent = createComponent(
                InnerComponentFunction,
                innerTemplate
            );

            const outerTemplate = {
                render() {
                    elementOpen('div');
                    component(InnerComponent, 'innerComponent');
                    elementClose('div');
                },
            };

            const OuterComponentFunction = jest.fn(({ props }) => props);

            const OuterComponent = createComponent(
                OuterComponentFunction,
                outerTemplate
            );

            const root = document.createElement('div');
            const eventListenerCallback = jest.fn(() => done());
            root.addEventListener('myBubblingEvent', eventListenerCallback);

            render(root, OuterComponent);

            return {
                InnerComponentFunction,
                OuterComponentFunction,
                eventListenerCallback,
            };
        };

        describe('by default', () => {
            it('if only the eventName was passed', done => {
                const {
                    InnerComponentFunction,
                    OuterComponentFunction,
                    eventListenerCallback,
                } = createElements(done);

                expect(InnerComponentFunction).toHaveBeenCalledTimes(1);
                expect(OuterComponentFunction).toHaveBeenCalledTimes(1);
                expect(eventListenerCallback).toHaveBeenCalledTimes(1);
            });

            it('if the eventName and some additional options are passed', done => {
                const {
                    InnerComponentFunction,
                    OuterComponentFunction,
                    eventListenerCallback,
                } = createElements(done, { cancelable: true });

                expect(InnerComponentFunction).toHaveBeenCalledTimes(1);
                expect(OuterComponentFunction).toHaveBeenCalledTimes(1);
                expect(eventListenerCallback).toHaveBeenCalledTimes(1);
            });
        });

        describe('by default is overwritten and prevented', () => {
            it('if `bubbles: false` is set manually', done => {
                const {
                    InnerComponentFunction,
                    OuterComponentFunction,
                    eventListenerCallback,
                } = createElements(done, { bubbles: false });

                expect(InnerComponentFunction).toHaveBeenCalledTimes(1);
                expect(OuterComponentFunction).toHaveBeenCalledTimes(1);
                expect(eventListenerCallback).not.toHaveBeenCalled();
            });
        });
    });
});
