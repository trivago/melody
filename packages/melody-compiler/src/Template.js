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
import { Node, type, alias, visitor } from 'melody-types';

export class Template extends Node {
    constructor(body = null) {
        super();
        this.parentName = null;
        this.body = body;
        this.macros = [];
        this.blocks = [];
        this.useImports = [];
    }
}
type(Template, 'Template');
alias(Template, 'Scope');
visitor(Template, 'parentName', 'macros', 'blocks', 'useImports', 'body');

export class File extends Node {
    constructor(fileName, template) {
        super();
        this.template = template;
        this.fileName = fileName;
    }
}
type(File, 'File');
//alias(File, 'Scope');
visitor(File, 'template');
