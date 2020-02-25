# melody-parser

This parser is an extensible parser for the Twig template language. It takes source code as input and produces an abstract syntax tree (AST) as output.

## Usage

The easiest way to use this parser is the `parse` function. Simply pass it a string of Twig or Melody code:

```javascript
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

### allowUnknownTags (`false`)

By default, the Melody parser throws an error when it encounters an unknown tag. This makes sense if you are preparing the generation of runnable code, because you don't know what to generate for unknown tags.

However, if you only want to parse a Twig file, unknown tags are fine. In this case, set `allowUnknownTags` to `true`. The parser will now generate `GenericTwigTag` nodes in the AST for Twig tags it does not know. For example, imagine this custom `exit` tag:

```
{% exit 404 %}
```

If we allow Melody to parse it generically, it will return the following AST node (some properties stripped and reordered for clarity):

```json
Object {
  "type": "GenericTwigTag",
  "tagName": "exit",
  "parts": Array [
    Object {
      "type": "NumericLiteral",
      "value": 404,
    },
  ],
  "sections": Array []
}
```

We can see the node type `GenericTwigTag`, and the `tagName` property, which has the value `exit`. Let's look at the other two properties:

-   `parts` is about what is going on inside the current Twig tag. In this example, there is only one more part, "404", which has been parsed as a `NumericLiteral`.
-   `sections` is only relevant for "multiTags", i.e., sequences of Twig tags that belong together.

As an example of a multi tag, let's look at the `nav` tag from [Craft CMS](https://docs.craftcms.com/v2/templating/nav.html):

```
{% nav items as item %}
    <li>{{ item.name }}</li>
{% endnav %}
```

Here, `nav` and `endnav` belong together. It's desirable to have this pair represented as one AST node, not two. The result looks like this (again, optimized and shortened for better readability):

```json
Object {
  "type": "GenericTwigTag",
  "tagName": "nav",
  "parts": Array [
    Object {
      "name": "items",
      "type": "Identifier",
    },
    Object {
      "name": "as",
      "type": "Identifier",
    },
    Object {
      "name": "item",
      "type": "Identifier",
    },
  ],
  "sections": Array [
    Object {
      "type": "SequenceExpression",
      "expressions": Array [
        Object {
          "name": "li",
          "type": "Element",
          "attributes": Array [],
          "children": Array [
            Object {
              // item.name representation
            },
          ],
        },
      ],
    },
    Object {
      "type": "GenericTwigTag",
      "tagName": "endnav",
      "parts": Array [],
      "sections": Array []
    },
  ],
}
```

Some things to note about this example:

-   The `nav` tag node has 3 entries in its `parts` array: `items`, `as`, and `item`, which are all `Identifier` nodes. Of course, semantically, only two of them (`items` and `item`) are real identifiers, whereas `as` is a keyword. However, since Melody does not know this tag, it does not distinguish between the two.
-   The `nav` tag has 2 entries in its `sections` array: A `SequenceExpression` representing everything between `{% nav %}` and `{% endnav %}`, and a `GenericTwigTag` representing the `{% endnav %}` tag. This shows us that everything up to and including the closing `{% endnav %}` is _part of_ the `nav` tag. The `GenericTwigTag` representing the `{% endnav %}` tag is not an independent, top-level AST node, but part of the AST node representing the `{% nav %}` tag.

However, in order to get this outcome, we have to tell Melody that `{% nav %}` and `{% endnav %}` belong together. This is done through the `multiTags` option.

### multiTags (`{}`)

In the section on `allowUnknownTags`, we saw that some tags belong together, like `{% nav %}` and `{% endnav %}`. In order to make this known to Melody, we use the `multiTags` option:

```json
{
    "multiTags": {
        "nav": ["endnav"],
        "switch": ["case", "default", "endswitch"]
    }
}
```

We can see that `multiTags` is an object. Its keys are tag names. These tag names must come first in a sequence of tags, e.g., `{% nav %}` always comes before `{% endnav %}`, therefore we must not configure `multiTags` like this, with the order reverted:

```json
{
    "multiTags": {
        "endnav": ["nav"] // DON'T DO THIS!!!
    }
}
```

The values of the `multiTags` object are arrays containing the other tag names that can occur in the tag sequence started by the first tag name. Here, it's important that the tag name closing the sequence comes last. For example, when configuring for the [`switch` tag in Craft CMS](https://docs.craftcms.com/v2/templating/switch.html), `endswitch` has to come last:

```json
{
    "multiTags": {
        "switch": ["case", "default", "endswitch"]
    }
}
```

Other than that, the order of the other tag names (here, `case` and `default`) is not important. Moreover, you can add as many `multiTags` entries as you want.

Note: If `multiTags` is non-empty, `allowUnknownTags` will automatically be set to `true`.

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
