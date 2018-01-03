require('babel-register');
const fs = require('fs');
const path = require('path');
const { compile, toString } = require('melody-compiler');
const { extension: coreExtension } = require('melody-extension-core');
const idomPlugin = require('melody-plugin-idom');

const plugins = [coreExtension, idomPlugin];

const name = 'itemElement';
fs.readFile(
    path.join(
        __dirname,
        '..',
        'packages',
        'melody-compiler',
        '__tests__',
        '__fixtures__',
        'success',
        name + '.template'
    ),
    (err, content) => {
        if (err) {
            throw err;
        }
        const code = content.toString();
        const startTime = +new Date();
        const jsAst = compile(name + '.twig', code, ...plugins, {
            options: {
                generateKey: false,
            },
        });
        toString(jsAst, code);
        console.log('Elapsed time: %dms', +new Date() - startTime);
    }
);
