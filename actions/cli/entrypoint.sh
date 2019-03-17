#!/bin/bash

set -e

# install https://github.com/tj/n
sh -c "npm install -g n"
sh -c "n -V"

# For test only
if [ -n "$VERDACCIO_AUTH_TOKEN" ]; then
  echo "ADDING VERDACCIO TOKEN"
  echo "//${VERDACCIO_REGISTRY_URL}/:_authToken=${VERDACCIO_AUTH_TOKEN}" > .npmrc
  sh -c "npm whoami --registry https://${VERDACCIO_REGISTRY_URL}"
fi

sh -c "$*"
