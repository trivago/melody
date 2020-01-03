# melody-parser

This parser is an extensible parser for the Twig template language.

## Usage

```javascript
const { CharStream, Lexer, TokenStream, Parser } = require('melody-parser');

const parser = new Parser(
    new TokenStream(new Lexer(new CharStream(code)), {
        ignoreComments: false,
        ignoreHtmlComments: false,
        preserveSourceLiterally: true,
    })
);
return parser.parse();
```

Shorthand usage, with all options set to defaults:

```javascript
const { parse } = require('melody-parser');

const abstractSyntaxTree = parse(
    '{% spaceless %} This is some Twig code {% endspaceless %}'
);
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
