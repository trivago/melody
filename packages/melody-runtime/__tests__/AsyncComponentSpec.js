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
import {
    patch,
    elementOpen,
    text,
    component,
    elementClose,
    enqueueComponent,
    flush,
} from 'melody-idom';
import { AsyncComponent } from '../src';

describe('AsyncComponent', () => {
    let unmounted = false;
    let notified = false;
    let el = null;

    beforeEach(function() {
        unmounted = false;
        notified = false;
        el = document.createElement('div');
    });

    class Component {
        constructor() {
            this.el = null;
            this.refs = Object.create(null);
            this.props = null;
        }

        apply(props) {
            this.props = props;
            enqueueComponent(this);
        }

        notify() {
            notified = true;
        }

        componentWillUnmount() {
            unmounted = true;
        }

        render() {
            elementOpen('div');
            text(this.props.text);
            elementClose('div');
        }
    }
    it('should render a promised component', async function() {
        const template = data => {
            component(AsyncComponent, 'test', {
                promisedComponent: () =>
                    Promise.resolve({ default: Component }),
                whileLoading: () => {
                    elementOpen('b');
                    text('Loading...');
                    elementClose('b');
                },
                onError: error => {
                    elementOpen('strong');
                    text(error);
                    elementClose('strong');
                },
                data,
            });
            component(AsyncComponent, 'test_failure', {
                promisedComponent: () =>
                    Promise.reject('Network connection issue'),
                whileLoading: () => {
                    elementOpen('b');
                    text('Loading...');
                    elementClose('b');
                },
                onError: error => {
                    elementOpen('strong');
                    text(error);
                    elementClose('strong');
                },
                data,
            });
        };
        patch(el, template, { text: 'Hello' });
        expect(el.innerHTML).toEqual(
            '<m-placeholder></m-placeholder><m-placeholder></m-placeholder>'
        );
        run(2);
        expect(el.innerHTML).toEqual('<b>Loading...</b><b>Loading...</b>');
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual(
            '<div>Hello</div><strong>Network connection issue</strong>'
        );

        patch(el, template, { text: 'Foo' });
        run();
        expect(el.innerHTML).toEqual(
            '<div>Foo</div><strong>Network connection issue</strong>'
        );

        expect(unmounted).toBeFalsy();
    });

    it('should render a promised component conditionally', async function() {
        const [ComponentA, resolveA] = createPromise();
        const [ComponentB, resolveB] = createPromise();
        const template = data => {
            elementOpen('div');
            if (data.treatment === 'A') {
                component(AsyncComponent, 'test', {
                    promisedComponent: () => ComponentA,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading A...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else if (data.treatment === 'B') {
                component(AsyncComponent, 'test_2', {
                    promisedComponent: () => ComponentB,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading B...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else {
                elementOpen('span', 'static');
                text('No magic component');
                elementClose('span');
            }
            elementClose('div');
        };
        patch(el, template, { text: 'Hello', treatment: 'A' });
        expect(el.innerHTML).toEqual(
            '<div><m-placeholder></m-placeholder></div>'
        );
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading A...</b></div>');
        resolveA({ default: Component });
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual('<div><div>Hello</div></div>');

        patch(el, template, { text: 'Foo', treatment: 'A' });
        run();
        expect(el.innerHTML).toEqual('<div><div>Foo</div></div>');

        expect(unmounted).toBeFalsy();
    });

    it('should render the correct async component when changed during loading', async function() {
        const [ComponentA, resolveA] = createPromise();
        const [ComponentB, resolveB] = createPromise();
        const template = data => {
            elementOpen('div');
            if (data.treatment === 'A') {
                component(AsyncComponent, 'test', {
                    promisedComponent: () => ComponentA,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading A...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else if (data.treatment === 'B') {
                component(AsyncComponent, 'test_2', {
                    promisedComponent: () => ComponentB,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading B...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else {
                elementOpen('span', 'static');
                text('No magic component');
                elementClose('span');
            }
            elementClose('div');
        };

        patch(el, template, { text: 'Hello', treatment: 'A' });
        expect(el.innerHTML).toEqual(
            '<div><m-placeholder></m-placeholder></div>'
        );
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading A...</b></div>');

        patch(el, template, { text: 'Foo', treatment: 'C' });
        resolveA({ default: Component });
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual(
            '<div><span>No magic component</span></div>'
        );

        expect(unmounted).toBeFalsy();
    });

    it('should unmount the async component', async function() {
        const [ComponentA, resolveA] = createPromise();
        const [ComponentB, resolveB] = createPromise();
        const template = data => {
            elementOpen('div');
            if (data.treatment === 'A') {
                component(AsyncComponent, 'test', {
                    promisedComponent: () => ComponentA,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading A...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else if (data.treatment === 'B') {
                component(AsyncComponent, 'test_2', {
                    promisedComponent: () => ComponentB,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading B...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else {
                elementOpen('span', 'static');
                text('No magic component');
                elementClose('span');
            }
            elementClose('div');
        };

        patch(el, template, { text: 'Hello', treatment: 'A' });
        expect(el.innerHTML).toEqual(
            '<div><m-placeholder></m-placeholder></div>'
        );
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading A...</b></div>');
        resolveA({ default: Component });
        await Promise.resolve();
        run(2);

        patch(el, template, { text: 'Foo', treatment: 'C' });
        run(2);
        expect(el.innerHTML).toEqual(
            '<div><span>No magic component</span></div>'
        );

        expect(unmounted).toBeTruthy();
    });

    it('should change components during loading', async function() {
        const [ComponentA, resolveA] = createPromise();
        const [ComponentB, resolveB] = createPromise();
        const template = data => {
            elementOpen('div');
            if (data.treatment === 'A') {
                component(AsyncComponent, 'test', {
                    promisedComponent: () => ComponentA,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading A...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else if (data.treatment === 'B') {
                component(AsyncComponent, 'test_2', {
                    promisedComponent: () => ComponentB,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading B...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else {
                elementOpen('span', 'static');
                text('No magic component');
                elementClose('span');
            }
            elementClose('div');
        };
        patch(el, template, { text: 'Hello', treatment: 'A' });
        expect(el.innerHTML).toEqual(
            '<div><m-placeholder></m-placeholder></div>'
        );
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading A...</b></div>');

        patch(el, template, { text: 'Foo', treatment: 'B' });
        resolveA({ default: Component });
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading B...</b></div>');

        resolveB({ default: Component });
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual('<div><div>Foo</div></div>');

        expect(unmounted).toBeFalsy();
    });

    it('should switch components after loading', async function() {
        const [ComponentA, resolveA] = createPromise();
        const [ComponentB, resolveB] = createPromise();
        const template = data => {
            elementOpen('div');
            if (data.treatment === 'A') {
                component(AsyncComponent, 'test', {
                    promisedComponent: () => ComponentA,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading A...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else if (data.treatment === 'B') {
                component(AsyncComponent, 'test_2', {
                    promisedComponent: () => ComponentB,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading B...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else {
                elementOpen('span', 'static');
                text('No magic component');
                elementClose('span');
            }
            elementClose('div');
        };
        patch(el, template, { text: 'Hello', treatment: 'A' });
        expect(el.innerHTML).toEqual(
            '<div><m-placeholder></m-placeholder></div>'
        );
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading A...</b></div>');

        resolveA({ default: Component });
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual('<div><div>Hello</div></div>');

        patch(el, template, { text: 'Foo', treatment: 'B' });
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading B...</b></div>');

        resolveB({ default: Component });
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual('<div><div>Foo</div></div>');

        expect(unmounted).toBeTruthy();
    });

    it('should ignore unnecessary async component', async function() {
        const [ComponentA, resolveA] = createPromise();
        const [ComponentB, resolveB] = createPromise();
        const template = data => {
            elementOpen('div');
            if (data.treatment === 'A') {
                component(AsyncComponent, 'test', {
                    promisedComponent: () => ComponentA,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading A...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else if (data.treatment === 'B') {
                component(AsyncComponent, 'test_2', {
                    promisedComponent: () => ComponentB,
                    whileLoading: () => {
                        elementOpen('b');
                        text('Loading B...');
                        elementClose('b');
                    },
                    onError: error => {
                        elementOpen('strong');
                        text(error);
                        elementClose('strong');
                    },
                    data,
                });
            } else {
                elementOpen('span', 'static');
                text('No magic component');
                elementClose('span');
            }
            elementClose('div');
        };

        patch(el, template, { text: 'Hello', treatment: 'A' });
        expect(el.innerHTML).toEqual(
            '<div><m-placeholder></m-placeholder></div>'
        );
        run(2);
        expect(el.innerHTML).toEqual('<div><b>Loading A...</b></div>');

        patch(el, template, { text: 'Foo', treatment: 'C' });
        run(2);
        expect(el.innerHTML).toEqual(
            '<div><span>No magic component</span></div>'
        );

        resolveA({ default: Component });
        await Promise.resolve();
        run(2);
        expect(el.innerHTML).toEqual(
            '<div><span>No magic component</span></div>'
        );

        expect(notified).toBeFalsy();
        expect(unmounted).toBeFalsy();
    });
});

function createPromise() {
    let resolve, reject;
    const p = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return [p, resolve, reject];
}

function run(rounds = 1) {
    for (var i = 0; i < rounds; i++) {
        flush({
            didTimeout: false,
            timeRemaining() {
                return 0;
            },
        });
    }
}
