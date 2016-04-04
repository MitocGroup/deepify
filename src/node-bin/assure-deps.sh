#!/usr/bin/env bash

babel=$(which babel)

if [ -z ${babel} ]; then
    echo "Seems like babel is not installed! Installing babel v5 as default transpiler..."
    echo ""
    npm install babel@5.x -g

    babel=$(which babel)
    babel_version=$(babel --version)
    
    echo "Installed babel ${babel_version}"
fi