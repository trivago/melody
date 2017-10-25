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
import * as t from 'babel-types';
import mountVisitor from './visitors/mount.js';
import idomVisitor from './visitors/idom.js';

export default {
    visitors: [idomVisitor, mountVisitor],
    filterMap: {
        raw(path) {
            if (path.parentPath.is('PrintStatement')) {
                path.replaceWithJS(
                    t.expressionStatement(
                        t.callExpression(
                            t.identifier(
                                path.state.addImportFrom('melody-idom', 'raw')
                            ),
                            [path.get('target').node]
                        )
                    )
                );
            } else {
                path.replaceWithJS(
                    t.callExpression(
                        t.identifier(
                            path.state.addImportFrom('melody-idom', 'rawString')
                        ),
                        [path.get('target').node]
                    )
                );
            }
        },
    },
};
