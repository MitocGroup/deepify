#!/usr/bin/env bash

source $(dirname $0)/_head.sh

### Undo Traspile to have valid coverage###
__CMD='npm run compile'

subpath_run_cmd ${__SRC_PATH} "$__CMD"

### Run Coverage ###
__CMD='npm run coverage'

subpath_run_cmd ${__SRC_PATH} "$__CMD"

### Merge Coverage results ###

COVERAGE_PATH=${__SCRIPT_PATH}"/../coverage"

istanbul-combine -d ${COVERAGE_PATH} -r lcovonly -p none \
  ${__SRC_PATH}/coverage/*.json

### Upload Coverage info to Codacy ###

#cat ${COVERAGE_PATH}"/lcov.info" | codacy-coverage
#cat ${COVERAGE_PATH}"/lcov.info" | coveralls
#
#### Cleanup! ###
#
#__CMD='rm -rf ./coverage'
#
#subpath_run_cmd ${__SRC_PATH} "$__CMD"
