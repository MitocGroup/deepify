if [ "$TRAVIS" == "true" ]; then
    echo "Skipping running uglify becuase we are in travis"
elif [ -d 'lib/' ] && [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    `which uglify` || npm install uglify -g; for f in $(find lib.compiled -type f -name *.js); do uglify -s ${f} -o ${f}; done;
elif [ -d 'lib/' ] && ([ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]); then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
elif [ -d 'lib/' ] && [ "$OSTYPE" == "msys" ]; then
    echo "Running obfuscate-compiled from git-bash without results"
fi
