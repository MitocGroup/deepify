#!/usr/bin/env bash

SCRIPT_PATH=$(cd $(dirname $0); pwd -P);

# If you change this, ensure to change 
#   deepify: 'src/lib/Elasticsearch/Server::DEFAULT_BINARY_PATH'
#   deep-framework: 'src/deep-search/lib/Client/Elasticsearch.js'
#   deep-framework: 'src/deep-search/node-bin/cleanup.sh'
ES_VERSION="2.3.5";
ES_DIR=${SCRIPT_PATH}/../resources/elasticsearch-${ES_VERSION};
ES_ZIP="${ES_DIR}/es.tar.gz"

if ! [ -d "${ES_DIR}" ]; then
    echo "Installing elasticsearch-${ES_VERSION} in ${ES_DIR}"

    mkdir -p "${ES_DIR}"
    rm -rf ${ES_DIR}/*

    curl -L -XGET https://download.elasticsearch.org/elasticsearch/release/org/elasticsearch/distribution/tar/elasticsearch/${ES_VERSION}/elasticsearch-${ES_VERSION}.tar.gz \
      -o ${ES_ZIP} -#

    tar -zxvf "${ES_ZIP}" -C "${ES_DIR}" --strip-components=1
    rm -f ${ES_ZIP}

    echo "elasticsearch-${ES_VERSION} has been installed in ${ES_DIR}"
fi

exit 0
