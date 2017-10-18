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
import { Binding } from './Binding';
import type Path from './Path';
const CACHE_KEY = Symbol();
let uid = 0;

export default class Scope {
    constructor(path: Path, parentScope?: Scope) {
        this.uid = uid++;
        this.parent = parentScope;

        this.parentBlock = path.parent;
        this.block = path.node;
        this.path = path;

        this.references = Object.create(null);
        this.bindings = Object.create(null);
        this.globals = Object.create(null);
        this.uids = Object.create(null);
        this.escapesContext = false;
        this._contextName = null;
        this.mutated = false;
        //this.contextName = parentScope && parentScope.contextName || '_context';
    }

    set contextName(val) {
        this._contextName = val;
    }

    get contextName() {
        if (this._contextName) {
            return this._contextName;
        }
        if (this.parent) {
            return this.parent.contextName || '_context';
        }
        return '_context';
    }

    static get(path: Path, parentScope?: Scope) {
        if (parentScope && parentScope.block == path.node) {
            return parentScope;
        }

        const cached = getCache(path.node);
        if (cached) {
            return cached;
        }

        const scope = new Scope(path, parentScope);
        path.node[CACHE_KEY] = scope;
        return scope;
    }

    get needsSubContext() {
        return this.escapesContext && this.hasCustomBindings;
    }

    get hasCustomBindings() {
        return !!Object.keys(this.bindings).length;
    }

    getBinding(name: string) {
        let scope = this;

        do {
            const binding = scope.getOwnBinding(name);
            if (binding) {
                return binding;
            }
            if (scope.path.is('RootScope')) {
                return;
            }
        } while ((scope = scope.parent));
    }

    getOwnBinding(name: string) {
        return this.bindings[name];
    }

    hasOwnBinding(name: string) {
        return !!this.getOwnBinding(name);
    }

    hasBinding(name: string) {
        return !name
            ? false
            : !!(this.hasOwnBinding(name) || this.parentHasBinding(name));
    }

    getRootScope() {
        let scope = this;
        while (scope.parent) {
            scope = scope.parent;
        }
        return scope;
    }

    registerBinding(name: string, path: Path = null, kind: string = 'context') {
        let scope = this;
        if (kind === 'global' && path === null) {
            scope = this.getRootScope();
        } else if (kind === 'const') {
            while (scope.parent) {
                scope = scope.parent;
                if (scope.path.is('RootScope')) {
                    break;
                }
            }
        }
        // todo identify if we need to be able to differentiate between binding kinds
        // if (scope.bindings[name]) {
        // todo: warn about colliding binding or fix it
        // }
        if (this.path.state) {
            this.path.state.markIdentifier(name);
        }
        return (scope.bindings[name] = new Binding(name, this, path, kind));
    }

    reference(name: string, path: Path) {
        let binding = this.getBinding(name);
        if (!binding) {
            binding = this.registerBinding(name);
        }
        binding.reference(path);
    }

    parentHasBinding(name: string) {
        return this.parent && this.parent.hasBinding(name);
    }

    generateUid(nameHint: string = 'temp') {
        const name = toIdentifier(nameHint);

        let uid,
            i = 0;
        do {
            uid = generateUid(name, i);
            i++;
        } while (this.hasBinding(uid));

        return uid;
    }
}

function getCache(node) {
    return node[CACHE_KEY];
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
        return `_${name}$${i}`;
    }
    return `_${name}`;
}
