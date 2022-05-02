#!/usr/bin/env bash
# @source https://github.com/nrwl/nx/blob/master/scripts/local-registry.sh
# @source https://github.com/facebook/create-react-app/blob/v4.0.0/tasks/local-registry.sh

set -x

default_verdaccio_package=verdaccio@^5.10.0
registry_url="http://localhost:4873"
original_npm_registry_url=`npm get registry`
original_yarn_registry_url=`yarn config get registry`

function startLocalRegistry {
  tmp_registry_log=`mktemp`
  echo "Starting Local Registry"
  echo "Registry output file: $tmp_registry_log"
  VERDACCIO_HANDLE_KILL_SIGNALS=true
  (nohup npx $default_verdaccio_package --config ./.verdaccio/config.yaml &>$tmp_registry_log &)
  # Wait for Verdaccio to boot
  grep -q 'http address' <(tail -f $tmp_registry_log)

  echo "Setting registry to local registry"
  npm config set registry $registry_url
  yarn config set registry $registry_url
}

function stopLocalRegistry {
  npm config delete registry
  yarn config delete registry
  CURRENT_NPM_REGISTRY=$(npm config get registry)
  CURRENT_YARN_REGISTRY=$(yarn config get registry)

  echo "Reverting registries"
  echo "  > NPM:  $CURRENT_NPM_REGISTRY"
  echo "  > YARN: $CURRENT_YARN_REIGSTRY"
}

# Use following source to extend functionality:
# @source: https://github.com/facebook/create-react-app/blob/v4.0.0/tasks/publish.sh
function publishToLocalRegistry {
	echo "Publishing to Local Registry"
  # Remove untracked files from the working tree
  # -d to recurse directories since no path is specified
  # -f force
	git clean -df
  yarn release --dry-run
}
