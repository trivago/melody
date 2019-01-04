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

        expect(unmounted).toEqual(false);
    });
});

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
