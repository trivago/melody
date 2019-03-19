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

export BRANCH=$(if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then echo $TRAVIS_BRANCH; else echo $TRAVIS_PULL_REQUEST_BRANCH; fi)

if [ "$BRANCH" = "master" ]; then
  # RELEASE AS @NEXT
  yarn install && \
    yarn lerna publish --no-git-tag-version --no-push --no-git-reset --exact --force-publish=* --canary --yes --dist-tag prerelease --registry https://registry.npmjs.org
  exit 0
else
  # CANARY RELEASE WITH COMMIT NAME
  # @commit
  yarn install && \
    yarn lerna publish --no-git-tag-version --no-push --no-git-reset --exact --force-publish=*  --canary --yes --dist-tag $BRANCH --preid $BRANCH --registry https://registry.npmjs.org
  exit 0
fi
