#!/usr/bin/env bash
if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    echo '{
      "presets": [
        "es2015"
      ]
    }' > .babelrc

    babel-node $(npm root -g)/istanbul/lib/cli.js cover `which _mocha` -- 'test/**/*.spec.js' \
    --reporter spec --ui tdd --recursive --timeout 20s

    RESULT_CODE=$?

    rm .babelrc

    exit $RESULT_CODE
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
    echo "Running from git-bash with gathering coverage"
    babel-node $(npm root -g)/istanbul/lib/cli.js cover _mocha -- 'test/**/*.spec.js' \
    --reporter spec --ui tdd --recursive --timeout 20s
fi
