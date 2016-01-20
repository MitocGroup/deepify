#!/usr/bin/env bash

SCRIPT_PATH=$(cd $(dirname $0); pwd -P)
BASH_PROFILE="$HOME/.bash_profile"
COMPLETION_ADD=". $SCRIPT_PATH/deepify_comp.sh"
IS_MAC=$(uname -a | grep Darwin)
CURRENT_USER=$(whoami)

if [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
   export DEEP_NO_INTERACTION=1
   echo "Added environment variable DEEP_NO_INTERACTION=1 for windows"
fi

if [ "$IS_MAC" = "" ]; then
    BASH_PROFILE="$HOME/.bashrc"
fi

if [ "$CURRENT_USER" = "nobody" ]; then
    echo "The setup script was run with 'sudo' command. Please login to your user:"
    HAS_COMPLETION_SRC=$(su $SUDO_USER -c "cat ${BASH_PROFILE} | grep \"$COMPLETION_ADD\" ")
else
    HAS_COMPLETION_SRC=$(cat ${BASH_PROFILE} | grep "$COMPLETION_ADD")
fi

if [ "$HAS_COMPLETION_SRC" = "" ]; then
    echo "Installing completion in ${BASH_PROFILE}"
    if [ "$CURRENT_USER" = "nobody" ]; then
        echo "The setup script was run with 'sudo' command. Please login to your user:"
        su $SUDO_USER -c "echo -e \"\n$COMPLETION_ADD\" >> ${BASH_PROFILE}"
    else
        echo -e "\n$COMPLETION_ADD" >> ${BASH_PROFILE}
    fi
else
    echo "Completion setup in ${BASH_PROFILE}, skipping..."
fi

## TODO: why it is not reloading properly?
#if [ "$CURRENT_USER" = "nobody" ]; then
#    echo "The setup script was run with 'sudo' command. Please login to your user:"
#    su $SUDO_USER -c "source ${BASH_PROFILE}"
#else
#    source ${BASH_PROFILE}
#fi