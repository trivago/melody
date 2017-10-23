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
import { PATH_CACHE_KEY } from 'melody-types';
import { Node, is } from 'melody-types';
import { visit } from './traverse';
import Scope from './Scope';

export default class Path {
    //region Path creation
    constructor(parent) {
        this.parent = parent;

        this.inList = false;
        this.listKey = null;
        this.parentKey = null;
        this.container = null;
        this.parentPath = null;

        this.key = null;
        this.node = null;
        this.type = null;

        this.state = null;

        this.data = Object.create(null);
        this.contexts = [];
        this.scope = null;
        this.visitor = null;

        this.shouldSkip = false;
        this.shouldStop = false;
        this.removed = false;
    }

    static get({ parentPath, parent, container, listKey, key }): Path {
        const targetNode = container[key],
            paths =
                (parent && parent[PATH_CACHE_KEY]) ||
                (parent ? (parent[PATH_CACHE_KEY] = []) : []);
        let path;

        for (let i = 0, len = paths.length; i < len; i++) {
            const candidate = paths[i];
            if (candidate.node === targetNode) {
                path = candidate;
                break;
            }
        }

        if (!path) {
            path = new Path(parent);
        }

        path.inList = !!listKey;
        path.listKey = listKey;
        path.parentKey = listKey || key;
        path.container = container;
        path.parentPath = parentPath || path.parentPath;

        path.key = key;
        path.node = path.container[path.key];
        path.type = path.node && path.node.type;

        if (!path.node) {
            /*eslint no-console: off*/
            console.log(
                'Path has no node ' + path.parentKey + ' > ' + path.key
            );
        }
        paths.push(path);

        return path;
    }

    //endregion

    //region Generic data
    setData(key: string, val: any): any {
        return (this.data[key] = val);
    }

    getData(key: string, def?: any): any {
        const val = this.data[key];
        if (!val && def) {
            return (this.data[key] = def);
        }
        return val;
    }
    //endregion

    //region Context
    pushContext(context) {
        this.contexts.push(context);
        this.setContext(context);
    }

    popContext() {
        this.contexts.pop();
        this.setContext(this.contexts[this.contexts.length - 1]);
    }

    setContext(context) {
        this.shouldSkip = false;
        this.shouldStop = false;
        this.removed = false;
        //this.skipKeys = {};

        if (context) {
            this.context = context;
            this.state = context.state;
            this.visitor = context.visitor;
        }

        this.setScope();
        return this;
    }

    getScope(scope: Scope) {
        if (Node.isScope(this.node)) {
            if (this.node.type === 'BlockStatement') {
                return Scope.get(this, scope.getRootScope());
            }
            return Scope.get(this, scope);
        }
        return scope;
    }

    setScope() {
        let target = this.context && this.context.scope;

        if (!target) {
            let path = this.parentPath;
            while (path && !target) {
                target = path.scope;
                path = path.parentPath;
            }
        }

        this.scope = this.getScope(target);
    }

    visit(): boolean {
        if (!this.node) {
            return false;
        }

        if (call(this, 'enter') || this.shouldSkip) {
            return this.shouldStop;
        }

        visit(this.node, this.visitor, this.scope, this.state, this);

        call(this, 'exit');

        return this.shouldStop;
    }

    skip() {
        this.shouldSkip = true;
    }

    stop() {
        this.shouldStop = true;
        this.shouldSkip = true;
    }

    resync() {
        if (this.removed) {
            return;
        }

        if (this.parentPath) {
            this.parent = this.parentPath.node;
        }

        if (this.parent && this.inList) {
            const newContainer = this.parent[this.listKey];
            if (this.container !== newContainer) {
                this.container = newContainer || null;
            }
        }

        if (this.container && this.node !== this.container[this.key]) {
            this.key = null;
            if (Array.isArray(this.container)) {
                let i, len;
                for (i = 0, len = this.container.length; i < len; i++) {
                    if (this.container[i] === this.node) {
                        this.setKey(i);
                        break;
                    }
                }
            } else {
                let key;
                for (key in this.container) {
                    if (this.container[key] === this.node) {
                        this.setKey(key);
                        break;
                    }
                }
            }
        }
    }

    setKey(key) {
        this.key = key;
        this.node = this.container[this.key];
        this.type = this.node && this.node.type;
    }

    requeue(path = this) {
        if (path.removed) {
            return;
        }

        for (const context of this.contexts) {
            context.maybeQueue(path);
        }
    }
    //endregion

    //region Modification
    replaceWith(value) {
        this.resync();

        const replacement = value instanceof Path ? value.node : value;

        if (this.node === replacement) {
            return;
        }

        replaceWith(this, replacement);
        this.type = replacement.type;
        this.resync();
        this.setScope();
        this.requeue();
    }

    replaceWithJS(replacement) {
        this.resync();
        replaceWith(this, replacement);
        this.type = replacement.type;
        this.resync();
        this.setScope();
    }

    replaceWithMultipleJS(...replacements) {
        this.resync();

        if (!this.container) {
            throw new Error('Path does not have a container');
        }
        if (!Array.isArray(this.container)) {
            throw new Error('Container of path is not an array');
        }

        this.container.splice(this.key, 1, ...replacements);
        this.resync();
        this.updateSiblingKeys(this.key, replacements.length - 1);
        markRemoved(this);
        //this.node = replacements[0];
    }

    remove() {
        this.resync();

        if (Array.isArray(this.container)) {
            this.container.splice(this.key, 1);
            this.updateSiblingKeys(this.key, -1);
        } else {
            replaceWith(this, null);
        }

        markRemoved(this);
    }

    updateSiblingKeys(fromIndex, incrementBy) {
        if (!this.parent) {
            return;
        }

        const paths: Array<Path> = this.parent[PATH_CACHE_KEY];
        for (const path of paths) {
            if (path.key >= fromIndex) {
                path.key += incrementBy;
            }
        }
    }
    //endregion

    is(type: String) {
        return is(this.node, type);
    }

    findParentPathOfType(type: String) {
        let path = this.parentPath;
        while (path && !path.is(type)) {
            path = path.parentPath;
        }
        return path && path.type === type ? path : null;
    }

    get(key) {
        let parts: Array = key.split('.'),
            context = this.context;
        if (parts.length === 1) {
            let node = this.node,
                container = node[key];
            if (Array.isArray(container)) {
                return container.map((_, i) =>
                    Path.get({
                        listKey: key,
                        parentPath: this,
                        parent: node,
                        container,
                        key: i,
                    }).setContext(context)
                );
            } else {
                return Path.get({
                    parentPath: this,
                    parent: node,
                    container: node,
                    key,
                }).setContext(context);
            }
        } else {
            let path = this;
            for (const part of parts) {
                if (Array.isArray(path)) {
                    path = path[part];
                } else {
                    path = path.get(part);
                }
            }
            return path;
        }
    }
}

function markRemoved(path) {
    path.shouldSkip = true;
    path.removed = true;
    path.node = null;
}

function replaceWith(path, node) {
    if (!path.container) {
        throw new Error('Path does not have a container');
    }

    path.node = path.container[path.key] = node;
}

function call(path, key): boolean {
    if (!path.node) {
        return false;
    }

    const visitor = path.visitor[path.node.type];
    if (!visitor || !visitor[key]) {
        return false;
    }

    const fns: Array<Function> = visitor[key];
    for (let i = 0, len = fns.length; i < len; i++) {
        const fn = fns[i];
        if (!fn) {
            continue;
        }

        const node = path.node;
        if (!node) {
            return true;
        }

        fn.call(path.state, path, path.state);

        // node has been replaced, requeue
        if (path.node !== node) {
            return true;
        }

        if (path.shouldStop || path.shouldSkip || path.removed) {
            return true;
        }
    }

    return false;
}
