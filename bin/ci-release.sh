#!/bin/bash

set -e

echo "ADDING NPM TOKEN"
echo "//registry.npmjs.org/:_authToken=\${NPM_AUTH_TOKEN}" > .npmrc
echo ""
echo "CHECK AUTHENTICATED USER"
npm whoami --registry https://registry.npmjs.org


if [ ! $? -eq 0 ]; then
    echo
    echo "USER AUTHENTICATION FAILED"
    echo
    exit 1
fi

if [ "$TRAVIS_BRANCH" = "master" ]; then
  # RELEASE AS @NEXT
  yarn install && \
    yarn lerna publish --skip-git --exact --force-publish=* --canary=commit --yes --npm-tag=next --registry https://registry.npmjs.org
  exit 0
else
  # CANARY RELEASE WITH COMMIT NAME
  # @commit
  yarn install && \
    yarn lerna publish --skip-git --exact --force-publish=*  --canary=commit --yes --registry https://registry.npmjs.org
  exit 0
fi
