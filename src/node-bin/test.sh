#!/usr/bin/env bash
if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    babel-node --presets 'node_modules/babel-preset-es2015' --plugins 'node_modules/babel-plugin-transform-es2015-classes' \
    `which isparta` cover --include 'lib/**/*.js' `which _mocha` -- 'test/**/*.spec.js' --reporter spec --ui tdd --recursive --timeout 20s
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
    echo "Running from git-bash without gathering coverage"
    babel-node `which _mocha` --ui tdd --recursive --reporter spec
fi
