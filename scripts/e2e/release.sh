#!/usr/bin/env bash
# @source https://github.com/facebook/create-react-app/blob/v4.0.0/tasks/e2e-simple.sh

set -x

root_path=$PWD

# Load functions for working with local NPM registry (Verdaccio)
source ./scripts/e2e/local-registry.sh

function cleanup {
  echo "Cleaning up."
  stopLocalRegistry
}

# Error messages are redirected to stderr
function handle_error {
  echo "$(basename $0): ERROR! An error was encountered executing line $1." 1>&2;
  cleanup
  echo "Exiting with error." 1>&2;
  exit 1
}

function handle_exit {
  cleanup
  echo "Exiting without error." 1>&2;
  exit
}

# Exit the script with a helpful error message when any error is encountered
trap 'set +x; handle_error $LINENO $BASH_COMMAND' ERR

# Cleanup before exit on any termination signal
trap 'set +x; handle_exit' SIGQUIT SIGTERM SIGINT SIGKILL SIGHUP

# Bootstrap monorepo
yarn

startLocalRegistry

yarn lint
yarn build

# Run tests with CI flag
CI=true yarn test

# Publish monorepo to local registry
publishToLocalRegistry

# Cleanup
cleanup