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
import template from './__fixtures__/withRefs.twig';
import { createComponent, render } from 'melody-component';
import { withRefs, bindEvents } from '../src';

describe('withRefs', () => {
    it('renders the component', () => {
        const getRefs = jest.fn(() => ({ unsubscribe: jest.fn() }));
        const enhance = withRefs(getRefs);
        const Component = enhance(createComponent(template));
        const el = document.createElement('div');
        render(el, Component, {
            text: 'foo',
        });
        expect(el.outerHTML).toMatchSnapshot();
    });

    it('invokes the ref retrieval function', () => {
        const getRefs = jest.fn(() => ({ unsubscribe: jest.fn() }));
        const enhance = withRefs(getRefs);
        const Component = enhance(createComponent(template));
        const el = document.createElement('div');
        render(el, Component, {
            text: 'foo',
        });
        expect(getRefs).toHaveBeenCalled();
    });

    it('registers the ref', () => {
        const myRef = jest.fn(() => ({ unsubscribe: jest.fn() }));
        const enhance = withRefs(() => ({ myRef }));
        const Component = enhance(createComponent(template));
        const el = document.createElement('div');
        render(el, Component, {
            text: 'foo',
        });
        expect(myRef).toHaveBeenCalledWith(el.querySelector('a'));
    });

    it('passes the component to the ref handler', () => {
        let text = '';
        const enhance = withRefs(component => {
            return {
                myRef: el => {
                    const handler = () => (text = component.getState().text);
                    el.addEventListener('click', handler);
                    return {
                        unsubscribe() {
                            el.removeEventListener('click', handler);
                        },
                    };
                },
            };
        });
        const Component = enhance(createComponent(template));
        const el = document.createElement('div');
        render(el, Component, {
            text: 'bar',
        });
        el
            .querySelector('a')
            .dispatchEvent(new Event('click', { bubbles: true }));
        expect(text).toEqual('bar');
    });

    it('allows the creation of a nice API for binding event handlers', () => {
        let text = '';
        const enhance = bindEvents({
            myRef: {
                click(event, component) {
                    text = component.getState().text;
                },
            },
        });
        const Component = enhance(createComponent(template));
        const el = document.createElement('div');
        render(el, Component, {
            text: 'bar',
        });
        el
            .querySelector('a')
            .dispatchEvent(new Event('click', { bubbles: true }));
        expect(text).toEqual('bar');
    });
});
