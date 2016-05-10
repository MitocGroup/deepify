#!/usr/bin/env bash

SCRIPT_PATH=$(cd $(dirname $0); pwd -P);
INSTALL_PATH=${SCRIPT_PATH}/../resources/skeletons;

[ -d ${INSTALL_PATH} ] && rm -rf ${INSTALL_PATH}

echo "Installing DeepMicroservicesSkeleton in '${MS_PATH}'"

git clone --depth 1 https://github.com/MitocGroup/deep-microservices-skeleton ${INSTALL_PATH} && \
ls -A ${INSTALL_PATH} | grep -v tpl | xargs -I '{}' rm -rf ${INSTALL_PATH}/{};

mv ${INSTALL_PATH}/tpl/* ${INSTALL_PATH}/
rm -rf ${INSTALL_PATH}/tpl

exit 0
