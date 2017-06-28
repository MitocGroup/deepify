#!/usr/bin/env bash

path=$(cd $(dirname $0); pwd -P)
npm=$(which npm)

inject_build_date() {
    cd "$1" && sed -e "4s/\"buildDate\": \".*\",/\"buildDate\": \"$2\",/" package.json
}

publish_npm_package() {
    local name=$(basename $1)

    echo "Publishing "${name}

    if [ -z $2 ] || ! $2; then
        cd $1 && rm -rf node_modules/ && npm install --no-shrinkwrap --production --no-bin-links --no-optional && ${npm} version $3 && ${npm} publish
    else
        cd $1 && ${npm} version $3
    fi
}

assure_npm() {
    if [ -z ${npm} ]; then
        assure_brew

        echo "Installing nodejs..."
        ${brew} install nodejs

        npm=$(which npm)
    fi
}
