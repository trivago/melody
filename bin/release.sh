#!/bin/bash

set -e
if ! git diff-files --quiet --
then
    echo >&2 "cannot $1: you have unstaged changes."
    git diff-files --name-status -r --ignore-submodules -- >&2
    exit 1
fi
if ! git diff-index --cached --quiet HEAD --
then
    echo >&2 "cannot $1: your index contains uncommitted changes."
    git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2
    exit 1
fi

yarn install && \
npm test && \
./node_modules/.bin/lerna publish --exact --force-publish=*
