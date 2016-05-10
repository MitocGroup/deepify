#!/usr/bin/env bash

SCRIPT_PATH=$(cd $(dirname $0); pwd -P);
MS_PATH=${SCRIPT_PATH}/../resources/skeletons;

[ -d ${MS_PATH} ] && rm -rf MS_PATH

echo "Installing DeepTemplateMicroservice in '${MS_PATH}'"
deepify install github://CCristi/DeepTemplateMicroservice ${SCRIPT_PATH}/../resources/skeletons

exit 0
