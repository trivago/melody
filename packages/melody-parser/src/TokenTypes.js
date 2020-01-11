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
export const EXPRESSION_START = 'expressionStart';
export const EXPRESSION_END = 'expressionEnd';
export const TAG_START = 'tagStart';
export const TAG_END = 'tagEnd';
export const INTERPOLATION_START = 'interpolationStart';
export const INTERPOLATION_END = 'interpolationEnd';
export const STRING_START = 'stringStart';
export const STRING_END = 'stringEnd';
export const DECLARATION_START = 'declarationStart';
export const COMMENT = 'comment';
export const WHITESPACE = 'whitespace';
export const HTML_COMMENT = 'htmlComment';
export const TEXT = 'text';
export const ENTITY = 'entity';
export const SYMBOL = 'symbol';
export const STRING = 'string';
export const OPERATOR = 'operator';
export const TRUE = 'true';
export const FALSE = 'false';
export const NULL = 'null';
export const LBRACE = '[';
export const RBRACE = ']';
export const LPAREN = '(';
export const RPAREN = ')';
export const LBRACKET = '{';
export const RBRACKET = '}';
export const COLON = ':';
export const COMMA = ',';
export const DOT = '.';
export const PIPE = '|';
export const QUESTION_MARK = '?';
export const ASSIGNMENT = '=';
export const ELEMENT_START = '<';
export const SLASH = '/';
export const ELEMENT_END = '>';
export const NUMBER = 'number';
export const EOF = 'EOF';
export const ERROR = 'ERROR';
export const EOF_TOKEN = {
    type: EOF,
    pos: {
        index: -1,
        line: -1,
        pos: -1,
    },
    end: -1,
    length: 0,
    source: null,
    text: '',
};

export const ERROR_TABLE = {
    [EXPRESSION_END]: 'expression end "}}"',
    [EXPRESSION_START]: 'expression start "{{"',
    [TAG_START]: 'tag start "{%"',
    [TAG_END]: 'tag end "%}"',
    [INTERPOLATION_START]: 'interpolation start "#{"',
    [INTERPOLATION_END]: 'interpolation end "}"',
};
