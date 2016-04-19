#!/usr/bin/env bash
if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    COMPILE_DIR='./compile';
    deepify compile-es6 test -x .js --out-dir ${COMPILE_DIR}/test
    deepify compile-es6 lib -x .js --out-dir ${COMPILE_DIR}/lib
    isparta cover --include ${COMPILE_DIR}/lib/**/*.js `which _mocha` -- ${COMPILE_DIR}/test/**/*.spec.js --reporter spec --ui tdd --recursive --timeout 20s
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
    echo "Running from git-bash without gathering coverage"
    babel-node `which _mocha` --ui tdd --recursive --reporter spec
fi
