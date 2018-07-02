import { compile, toString } from 'melody-compiler';
import { extension as coreExtension } from 'melody-extension-core';
import idomPlugin from 'melody-plugin-idom';
import skipIfPlugin from '../src';

test('load should compile to import()', () => {
    expect(render(`{{ load('fancy-component') }}`)).toMatchSnapshot();
});

test('loadSync should compile to import statement', () => {
    expect(render(`{{ loadSync('fancy-component') }}`)).toMatchSnapshot();
});

function render(template) {
    try {
        const jsTemplate = compile(
            'test.twig',
            template,
            coreExtension,
            idomPlugin,
            skipIfPlugin
        );
        return toString(jsTemplate, template).code;
    } catch (e) {
        return e.message;
    }
}
