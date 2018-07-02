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
import type { File } from '../Template';
import codeFrame from 'melody-code-frame';
import * as t from 'babel-types';
import { relative } from 'path';
import * as random from 'random-seed';

export default class State {
    constructor(file: File, source: String) {
        this.file = file;
        this.source = source;
        this.template = file.template;
        this.options = {
            generateKey: true,
            projectRoot: undefined,
            // eslint-disable-next-line
            warn: console.warn.bind(console),
            // eslint-disable-next-line
            error: console.error.bind(console),
        };
        this.program = {
            type: 'Program',
            body: [],
            sourceType: 'module',
        };
        this._importCache = Object.create(null);
        this.filterMap = Object.create(null);
        this.functionMap = Object.create(null);
        this._usedIdentifiers = Object.create(null);
        this._spacelessStack = [];
    }

    generateKey() {
        if (this.keyGenerator === undefined) {
            this.keyGenerator = createKeyGenerator(
                this.file.fileName,
                this.options.projectRoot || process.cwd()
            );
        }
        return this.keyGenerator.generate();
    }

    enterSpaceless() {
        this._spacelessStack.push(true);
    }

    exitSpaceless() {
        this._spacelessStack.pop();
    }

    isInSpaceless() {
        return !!this._spacelessStack[this._spacelessStack.length - 1];
    }

    error(message, pos, advice, length = 1) {
        let errorMessage = `${message}\n`;
        errorMessage += codeFrame({
            rawLines: this.source,
            lineNumber: pos.line,
            colNumber: pos.column,
            length,
        });
        if (advice) {
            errorMessage += '\n\n' + advice;
        }
        throw new Error(errorMessage);
    }

    warn(message, pos, advice, length = 1) {
        let warnMessage = `${message}\n`;
        warnMessage += codeFrame({
            rawLines: this.source,
            lineNumber: pos.line,
            colNumber: pos.column,
            length,
        });
        if (advice) {
            warnMessage += '\n\n' + advice;
        }
        this.options.warn(warnMessage);
    }

    markIdentifier(name) {
        this._usedIdentifiers[name] = true;
    }

    generateUid(nameHint: string = 'temp') {
        const name = toIdentifier(nameHint);

        let uid;
        let i = 0;
        do {
            uid = generateUid(name, i);
            i++;
        } while (this._usedIdentifiers[uid]);

        return uid;
    }

    generateComponentUid(nameHint: string = 'temp') {
        const name = toIdentifier(nameHint);

        let uid;
        let i = 0;
        do {
            uid = generateComponentUid(name, i);
            i++;
        } while (this._usedIdentifiers[uid]);

        return uid;
    }

    getImportFrom(source) {
        if (this._importCache[source]) {
            return this._importCache[source];
        }

        const body = this.program.body;
        let i = 0;
        for (const len = body.length; i < len; i++) {
            const stmt = body[i];
            if (stmt.type === 'ImportDeclaration') {
                if (stmt.source.value === source) {
                    this._importCache[source] = stmt;
                    return stmt;
                }
            }
        }
        return null;
    }

    addNamespaceImportFrom(source, alias) {
        const body = this.program.body;
        let i = 0;
        for (const len = body.length; i < len; i++) {
            const stmt = body[i];
            if (stmt.type === 'ImportDeclaration') {
                if (stmt.source.value === source) {
                    if (stmt.specifiers.length === 1) {
                        const specifier = stmt.specifiers[0];
                        if (
                            specifier.type === 'ImportNamespaceSpecifier' &&
                            specifier.local.name === alias
                        ) {
                            return stmt;
                        }
                    }
                }
            }
        }
        const importDeclaration = t.importDeclaration(
            [t.importNamespaceSpecifier(t.identifier(alias))],
            t.stringLiteral(source)
        );
        this.program.body.splice(0, 0, importDeclaration);
        return importDeclaration;
    }

    addImportFrom(source, identifier, local = this.generateUid(identifier)) {
        let importDecl = this.getImportFrom(source);
        if (importDecl) {
            let i = 0;
            let isNamespaceImport = false;
            for (
                const specs = importDecl.specifiers, len = specs.length;
                i < len;
                i++
            ) {
                const spec = specs[i];
                if (
                    spec.type === 'ImportSpecifier' &&
                    spec.imported &&
                    spec.imported.name === identifier
                ) {
                    // already imported it
                    return spec.local.name;
                } else if (spec.type === 'ImportNamespaceSpecifier') {
                    isNamespaceImport = true;
                    break;
                }
            }

            if (!isNamespaceImport) {
                importDecl.specifiers.push(
                    t.importSpecifier(
                        t.identifier(local),
                        t.identifier(identifier)
                    )
                );
                return local;
            }
        }

        importDecl = t.importDeclaration(
            [t.importSpecifier(t.identifier(local), t.identifier(identifier))],
            t.stringLiteral(source)
        );
        this._importCache[source] = importDecl;
        this.program.body.splice(0, 0, importDecl);
        return local;
    }

    addDefaultImportFrom(source, local = this.generateUid()) {
        let importDecl = this.getImportFrom(source);
        if (!importDecl) {
            importDecl = t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier(local))],
                t.stringLiteral(source)
            );
            this._importCache[source] = importDecl;
            this.program.body.splice(0, 0, importDecl);
        } else {
            if (importDecl.specifiers[0].type === 'ImportDefaultSpecifier') {
                return importDecl.specifiers[0].local.name;
            }
            importDecl.specifiers.unshift(
                t.importDefaultSpecifier(t.identifier(local))
            );
        }
        return local;
    }

    ensureImportFrom(source) {
        let importDecl = this.getImportFrom(source);
        if (!importDecl) {
            importDecl = t.importDeclaration([], t.stringLiteral(source));
            this._importCache[source] = importDecl;
            this.program.body.splice(0, 0, importDecl);
        }
    }

    insertGlobalVariableDeclaration(kind, id, init) {
        const decl = t.variableDeclarator(id, init);
        for (const stmt of (this.program.body: Array)) {
            if (stmt.type === 'VariableDeclaration' && stmt.kind === kind) {
                stmt.declarations.push(decl);
                return stmt;
            }
        }
        const stmt = t.variableDeclaration(kind, [decl]);
        this.program.body.push(stmt);
        return stmt;
    }

    insertAfter(stmt, sibling) {
        const index = this.program.body.indexOf(sibling);
        this.program.body.splice(index + 1, 0, stmt);
        return stmt;
    }

    insertBefore(stmt, sibling) {
        const index = this.program.body.indexOf(sibling);
        this.program.body.splice(index, 0, stmt);
        return stmt;
    }

    isReferenceIdentifier(path) {
        const parentPath = path.parentPath,
            key = path.parentKey;

        if (
            parentPath.is('MemberExpression') &&
            key === 'property' &&
            !parentPath.node.computed
        ) {
            return false;
        }

        if (parentPath.is('NamedArgumentExpression')) {
            return false;
        }

        if (
            parentPath.is('MountStatement') &&
            key === 'name' &&
            parentPath.node.source
        ) {
            return false;
        }

        if (
            parentPath.is('ObjectProperty') &&
            key === 'key' &&
            !parentPath.node.computed
        ) {
            return false;
        }

        if (parentPath.is('Attribute') && key !== 'value') {
            return false;
        }

        if (parentPath.is('BlockStatement') && key === 'name') {
            return false;
        }

        if (
            parentPath.is('ForStatement') &&
            (key === 'keyTarget' || key === 'valueTarget')
        ) {
            return false;
        }

        if (
            parentPath.is('ImportDeclaration') ||
            parentPath.is('AliasExpression')
        ) {
            return false;
        }

        if (
            parentPath.is('MacroDeclarationStatement') &&
            (key === 'name' || key === 'arguments')
        ) {
            return false;
        }

        if (parentPath.is('VariableDeclarationStatement') && key === 'name') {
            return false;
        }

        if (parentPath.is('CallExpression') && key === 'callee') {
            return false;
        }

        return true;
    }
}

function toIdentifier(nameHint) {
    let name = nameHint + '';
    name = name.replace(/[^a-zA-Z0-9$_]/g, '');

    name = name.replace(/^[-0-9]+/, '');
    name = name.replace(/[-\s]+(.)?/, function(match, c) {
        return c ? c.toUpperCase() : '';
    });

    name = name.replace(/^_+/, '').replace(/[0-9]+$/, '');
    return name;
}

function generateUid(name, i) {
    if (i > 0) {
        return `${name}$${i}`;
    }
    return name;
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateComponentUid(name, i) {
    const finalName = capitalize(name);
    if (i > 0) {
        return `${finalName}$${i}`;
    }
    return finalName;
}

/**
 * If filename is not defined, generates random keys based on Math.random.
 * Otherwise, uses filename as a seed for deterministic keys. Filename is
 * converted to a relative path based on `projectRoot`.
 */
function createKeyGenerator(filename, projectRoot) {
    // if filename is not defined, generate random keys
    // based on Math.random
    // otherwise, use filename as a seed for deterministic keys
    const relativePath = filename ? relative(projectRoot, filename) : undefined;

    const generator = random.create(relativePath);
    return {
        generate() {
            let i;
            let s = '';
            // 7 chars long keys
            for (i = 0; i < 7; i++) {
                // start from 33th ASCII char (!), skipping quote ("), ampersand (&)
                // and backslash (\)
                // math: 33 + 91 + 3 = 127, 126 (tilde ~) is the last char we allow
                // where 3 is number of chars we skip between 33-127

                let rand = 33 + generator(91);
                // skip quote (")
                if (rand >= 34) {
                    rand++;
                }
                // skip ampersand (&)
                if (rand >= 38) {
                    rand++;
                }
                // skip backslash (\)
                if (rand >= 92) {
                    rand++;
                }
                s += String.fromCharCode(rand);
            }
            return s;
        },
    };
}
