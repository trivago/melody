#!/bin/bash

set -e

# install https://github.com/tj/n
sh -c "npm install -g n"
sh -c "n -V"

# adding git config
sh -c "git config --global user.email \"melody-bot@trivago.com\""
sh -c "git config --global user.name \"melody-bot\""

# some useful variables
export CURRENT_COMMIT_TEXT=$(git log --oneline --format=%B -n 1 HEAD)

# For test only
if [ -n "$NPM_AUTH_TOKEN" ]; then
  echo "ADDING TOKEN"
  echo "//${REGISTRY_URL}/:_authToken=${NPM_AUTH_TOKEN}" > .npmrc
  sh -c "npm whoami --registry https://${REGISTRY_URL}"
fi

sh -c "$*"
