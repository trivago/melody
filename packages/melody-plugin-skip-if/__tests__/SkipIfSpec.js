import { compile, toString } from 'melody-compiler';
import { extension as coreExtension } from 'melody-extension-core';
import idomPlugin from 'melody-plugin-idom';
import skipIfPlugin from '../src';

test('skip if client should skip content', () => {
    expect(
        render(`<div>{% skip if client %}hello world{% endskip %}</div>`)
    ).toMatchSnapshot();
});

test('skip if server should be ignored', () => {
    expect(
        render(`<div>{% skip if server %}hello world{% endskip %}</div>`)
    ).toMatchSnapshot();
});

test('skip if defined should check if parent element is defined', () => {
    expect(
        render(`<x-div>{% skip if defined %}hello world{% endskip %}</x-div>`)
    ).toMatchSnapshot();
});

test('skip if defined should fail if parent element is not a custom element', () => {
    expect(
        render(`<div>{% skip if defined %}hello world{% endskip %}</div>`)
    ).toMatchSnapshot();
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
