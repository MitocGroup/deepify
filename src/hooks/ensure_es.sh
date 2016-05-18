#!/usr/bin/env bash

SCRIPT_PATH=$(cd $(dirname $0); pwd -P);
ES_VERSION="2.1.2"
ES_DIR=${SCRIPT_PATH}/../resources/elasticsearch;
ES_ZIP="${ES_DIR}/es-${ES_VERSION}.tar.gz"

if ! [ -f "${ES_ZIP}" ]; then
    echo "Installing elasticsearch-${ES_VERSION} in ${ES_DIR}"

    mkdir -p "${ES_DIR}"
    rm -rf ${ES_DIR}/*

    curl -L -XGET https://download.elasticsearch.org/elasticsearch/release/org/elasticsearch/distribution/tar/elasticsearch/${ES_VERSION}/elasticsearch-${ES_VERSION}.tar.gz \
      -o ${ES_ZIP} -#

    tar -zxvf "${ES_ZIP}" -C "${ES_DIR}" --strip-components=1

    echo "elasticsearch-${ES_VERSION} has been installed in ${ES_DIR}"
fi

exit 0
