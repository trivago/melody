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
export class Binding {
    constructor(identifier, scope, path, kind = 'global') {
        this.identifier = identifier;
        this.scope = scope;
        this.path = path;
        this.kind = kind;

        this.referenced = false;
        this.references = 0;
        this.referencePaths = [];
        this.definitionPaths = [];
        this.shadowedBinding = null;
        this.contextual = false;

        this.data = Object.create(null);
    }

    getData(key) {
        return this.data[key];
    }

    setData(key, value) {
        this.data[key] = value;
    }

    reference(path) {
        this.referenced = true;
        this.references++;
        this.referencePaths.push(path);
    }

    // dereference(path) {
    //   if (path) {
    //     this.referencePaths.splice(this.referencePaths.indexOf(path), 1);
    //   }
    //   this.references--;
    //   this.referenced = !!this.references;
    // }

    getRootDefinition() {
        if (this.shadowedBinding) {
            return this.shadowedBinding.getRootDefinition();
        }
        return this;
    }
}
