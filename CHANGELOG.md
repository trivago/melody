## master

### Bugfixes
- Fix melody-stream not rerendering in some cases [#112](https://github.com/trivago/melody/pull/112)
- Warn about usage of non-breaking space [#107](https://github.com/trivago/melody/pull/107)
- Fixed bindings of dispatchCustomEvent in `melody-streams` [#117](https://github.com/trivago/melody/pull/117)
- Fixed `combineRefs` unsubscription in `melody-streams` [#120](https://github.com/trivago/melody/pull/120)

### Chore & Maintenance
- Removes `Chai` and `Sinon` support, Migrates tests to use `Jest`'s matchers. [#103](https://github.com/trivago/melody/pull/103)
- Drop `bundledDependencies` option in package.json's to avoid issues with yarn [#113](https://github.com/trivago/melody/pull/113)
- Add Github Actions for automation [#109](https://github.com/trivago/melody/pull/109)
- Update various dependencies (lerna, babel-generate, etc.) [#95](https://github.com/trivago/melody/pull/95)

## 1.2.0-21.2 (beta)

## 1.2.0-5 (beta)

### Features

- Introduce `melody-streams` API [#102](https://github.com/trivago/melody/pull/102)

## 1.2.0-4 (beta)

### Features

- Filter `trim`: add support for advanced features [#64](https://github.com/trivago/melody/pull/64)
- Throw an error in `melody-redux`'s connect if no store found [#68](https://github.com/trivago/melody/pull/68)
- Introduce `melody-hooks` API [#74](https://github.com/trivago/melody/pull/74)
- `[melody-compiler]` warns on `mount` statement without `as` key [#48](https://github.com/trivago/melody/pull/48)
- Introduce `useAtom` hook [#79](https://github.com/trivago/melody/pulls/79)
- Introduce `useStore` hook and performance marks for hooks [#98](https://github.com/trivago/melody/pulls/98)
- Added async mounting of components [#82](https://github.com/trivago/melody/pull/82)

### Fixes

- incorrect 'is' method call in melody-types [#20](https://github.com/trivago/melody/issues/20)
- getFocusedPath can break on IE11 for svg elements [#57](https://github.com/trivago/melody/issues/57)

### Chore & Maintenance

- Added PR template
- Fix rollup config to generate esm properly [#42](https://github.com/trivago/melody/pull/42)
- Added `testURL` in Jest config. [#49](https://github.com/trivago/melody/pull/49)
- Migration to `babel-preset-env`. [#50](https://github.com/trivago/melody/issues/50)
- Drops node 7 support `babel-preset-env`. [#55](https://github.com/trivago/melody/issues/55)
- Adds node 10 support `babel-preset-env`. [#55](https://github.com/trivago/melody/issues/55)
- Updates `bundlesize` dependency to `^0.15.2`, the latest release
- Removes warnings during installation thrown by `lerna` and `npm`
- Adds bundlesize token to travis config
- Publishes packages for pushes to pull requests, based on the merge result

## 1.1.0

### Features

- `[melody-compiler]`, `[melody-loader]` added `melody-logger`
- `[melody-idom]` added experimental synchronous deep rendering
- Added `melody-plugin-load-functions`
- Added `melody-plugin-skip-if`

### Fixes

- Added transform-object-rest-spread plugin
- `[melody-compiler]` remove `path.parse` dependency
- Fixed typo in call date filter
- Skip over all empty elements

### Chore & Maintenance

- Fix ci with workflows and test on node 6 & 8
- `[melody-runtime]` fix filter tests

## 1.0.4

### Fixes

- `[melody-idom]` revert commit [fdeef10](https://github.com/trivago/melody/commit/fdeef107bede824260916d458f956d3ee77d04e2): bugfix/remove-event-handlers
- `[melody-jest-transform]` fixed peer dependencies

## 1.0.3

### Docs

- Added dependancy installation steps to `README`

### Tests

- `[melody-code-frame]` added unit tests
- `[melody-jest-transform]` added unit tests

### Fixes

- Fixed `README` image
- `[melody-idom]` remove event handlers
- Compiler benchmark
- `[melody-types]` added missing constant type
- `[melody-runtime]` jest test cases with UTC timezone
- `[melody-compiler]`, `[melody-parser]` fix not in operator
- `[melody-idom]` draggable attribute to allow 'false' as value

### Chore & Maintenance

- Added bundle size status on `travis`
- Added Community guidelines for github repository
- Added Coveralls

## 1.0.2

### Fixes

- `[melody-idom]` ignore string refs if server-side rendered

## 1.0.1

### Features

- Added package `neutrino-preset-melody`

### Chore & Maintenance

- Setup `travis`

## <=1.0.1

- See commit history for changes in previous versions of jest.
