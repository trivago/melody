#!/bin/sh

set -e

LOCAL_REGISTRY="http://0.0.0.0:4873"

# create .npmrc
NPM_AUTH_TOKEN="test_token" 
VERDACCIO_CONFIG_USERCONFIG="${VERDACCIO_CONFIG_USERCONFIG-"$HOME/.npmrc"}"
VERDACCIO_REGISTRY_URL="${VERDACCIO_REGISTRY_URL-0.0.0.0:4873}"
VERDACCIO_STRICT_SSL="${VERDACCIO_STRICT_SSL-false}"
VERDACCIO_REGISTRY_SCHEME="http"
printf "//%s/:_authToken=%s\\nregistry=%s\\nstrict-ssl=%s" "$VERDACCIO_REGISTRY_URL" "$NPM_AUTH_TOKEN" "${VERDACCIO_REGISTRY_SCHEME}://$VERDACCIO_REGISTRY_URL" "${VERDACCIO_STRICT_SSL}" > "$VERDACCIO_CONFIG_USERCONFIG"

chmod 0600 "$VERDACCIO_CONFIG_USERCONFIG"

PACKAGE_VERSION=$(cat lerna.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')



# Start local registry
tmp_registry_log=`mktemp`
sh -c "mkdir -p $HOME/.config/verdaccio"
sh -c "cp --verbose /config.yaml $HOME/.config/verdaccio/config.yaml"
sh -c "nohup verdaccio --config $HOME/.config/verdaccio/config.yaml &>$tmp_registry_log &"
# Wait for `verdaccio` to boot
#
#
# Login so we can publish packages
sh -c "npm set registry https://registry.npmjs.org/"
sh -c "npx npm-auth-to-token@1.0.0 -u test -p test -e test@test.local -r $LOCAL_REGISTRY"
sh -c "npm whoami --registry $LOCAL_REGISTRY"
sh -c "yarn lerna publish --npm-client=npm --yes --force-publish=* --skip-git --repo-version $PACKAGE_VERSION --exact --npm-tag=latest --registry $LOCAL_REGISTRY"