#!/usr/bin/env bash
if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    deepify compile-es6 test -x .js
    deepify compile-es6 lib -x .js
    isparta cover --include 'lib/**/*.js' `which _mocha` -- 'test/Helpers/Exec.spec.js' --reporter spec --ui tdd --recursive --timeout 20s
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
    echo "Running from git-bash without gathering coverage"
    babel-node `which _mocha` --ui tdd --recursive --reporter spec
fi
