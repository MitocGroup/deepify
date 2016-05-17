#!/usr/bin/env bash

SCRIPT_PATH=$(cd $(dirname $0); pwd -P);
ES_DIR=${SCRIPT_PATH}/../resources/elasticsearch;
ES_ZIP=${ES_DIR}/es.tar.gz

echo "Installing elasticsearch-2.1.2 in ${ES_DIR}"

[ -d "${ES_DIR}" ] || mkdir "${ES_DIR}";
curl -L -XGET https://download.elasticsearch.org/elasticsearch/release/org/elasticsearch/distribution/tar/elasticsearch/2.1.2/elasticsearch-2.1.2.tar.gz \
  -o ${ES_DIR}/es.tar.gz -#

tar -zxvf "${ES_ZIP}" -C "${ES_DIR}" --strip-components=1
rm -f "${ES_ZIP}"

echo "elasticsearch-2.1.2 has been installed in ${ES_DIR}"

exit 0
