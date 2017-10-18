require('babel-register');
const fs = require('fs');
const path = require('path');
const { compile, toString } = require('../packages/compiler');
const { extension: coreExtension } = require('../packages/extension-core');

const name = 'itemElement';
fs.readFile(
    path.join(
        __dirname,
        '..',
        'packages',
        'compiler',
        '__tests__',
        'fixtures',
        name + '.twig',
    ),
    (err, content) => {
        if (err) {
            throw err;
        }
        const code = content.toString();
        const startTime = +new Date();
        var jsAst = compile(name + '.twig', code, coreExtension, {
            options: {
                generateKey: false,
            },
        });
        toString(jsAst, code);
        console.log('Elapsed time: %dms', +new Date() - startTime);
    },
);
