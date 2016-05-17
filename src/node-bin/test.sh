#!/usr/bin/env bash
if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    COMPILE_DIR='./compile';

    [ -d ${COMPILE_DIR} ] && rm -rf ${COMPILE_DIR};

    COMPILE() {
        local resource=$1;

        babel -x .js --presets es2015-node4 --plugins add-module-exports,transform-es2015-classes \
            ${resource} --out-dir ${COMPILE_DIR}/${resource}
    }

    COMPILE lib;
    COMPILE test;

    isparta cover --include ${COMPILE_DIR}/lib/**/*.js `which _mocha` -- ${COMPILE_DIR}/test/**/*.spec.js \
        --reporter spec --ui tdd --recursive --timeout 20s
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
    echo "Running from git-bash without gathering coverage"
    babel-node `which _mocha` --ui tdd --recursive --reporter spec
fi
