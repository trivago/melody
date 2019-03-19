#!/bin/bash

set -e

echo "ADDING NPM TOKEN"
echo "//registry.npmjs.org/:_authToken=\${NPM_AUTH_TOKEN}" > .npmrc
echo ""
echo "CHECK AUTHENTICATED USER"
npm whoami --registry https://registry.npmjs.org
echo "BRANCH: \${TRAVIS_BRANCH}"

if [ ! $? -eq 0 ]; then
    echo
    echo "USER AUTHENTICATION FAILED"
    echo
    exit 1
fi

if [ "$TRAVIS_BRANCH" = "master" ]; then
  # RELEASE AS @NEXT
  yarn install && \
    yarn lerna publish --no-git-tag-version --no-push --no-git-reset --exact --force-publish=* --canary --yes --dist-tag prerelease --registry https://registry.npmjs.org
  exit 0
else
  # CANARY RELEASE WITH COMMIT NAME
  # @commit
  yarn install && \
    yarn lerna publish --no-git-tag-version --no-push --no-git-reset --exact --force-publish=*  --canary --yes --dist-tag $TRAVIS_BRANCH --preid $TRAVIS_BRANCH --registry https://registry.npmjs.org
  exit 0
fi
