# melody-parser

This parser is an extensible parser for the Twig template language. It takes source code as input and produces an abstract syntax tree (AST) as output.

## Usage

```
const { parse } = require('melody-parser');

const code = '{% spaceless %} This is some Twig code {% endspaceless %}';
const abstractSyntaxTree = parse(code);
```

The `parse` function is a convenient façade function that does the instantiation of Lexer, Tokenizer, and Parser, and passes forward any options that may be provided. Example with options:

```javascript
const abstractSyntaxTree = parse(code, {
    ignoreComments: false,
    ignoreHtmlComments: false,
    decodeEntities: true,
});
```

There is also a third parameter called `extensions`. It collects the third parameter and all parameters that come after it, so you can pass as many extensions as you want:

```javascript
import { extension as coreExtensions } from 'melody-extension-core';
import customExtension from 'melody-extension-custom';

const abstractSyntaxTree = parse(
    code,
    {
        decodeEntities: true,
    },
    coreExtension,
    customExtension
);
```

If you have no options to pass, you can also omit them, and start passing extensions from the 2nd parameter on:

```javascript
import { extension as coreExtensions } from 'melody-extension-core';
import customExtension from 'melody-extension-custom';

const abstractSyntaxTree = parse(code, coreExtension, customExtension);
```

## Options

### ignoreComments (`true`)

If set to `true`, Twig comments will not be part of the resulting abstract syntax tree (AST). Defaults to `true`.

### ignoreHtmlComments (`true`)

If set to `true`, HTML comments will not be part of the resulting abstract syntax tree (AST). Defaults to `true`.

### preserveSourceLiterally (`false`)

This option can be useful for pretty printing scenarios, hence it is turned off by default. If set to `true`, transformations like decoding of HTML entities or escape sequences will not be applied.

### decodeEntities (`true`, deprecated, use `preserveSourceLiterally` instead)

Character references/entities like `&#8206;` will be decoded if this is set to `true` (default). Otherwise, the string will be taken over verbatim to the AST.

### ignoreDeclarations (`true`)

Declarations like `<!DOCTYPE html>` are not added to the parse tree if set to `true`.
