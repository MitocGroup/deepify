#!/usr/bin/env bash

babel=$(which babel)

if [ -z ${babel} ]; then
    echo "Seems like babel is not installed! Installing babel v5 as default transpiler..."
    echo ""
    npm install babel-cli@6.x -g

    babel=$(which babel)
    babel_version=$(babel --version)
    
    echo "Installed babel ${babel_version}"
fi

echo "Installing babel-es2015 preset"
npm install babel-preset-es2015
npm install babel-plugin-add-module-exports