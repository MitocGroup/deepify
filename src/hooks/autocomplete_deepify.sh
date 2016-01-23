#!/usr/bin/env bash

SCRIPT_PATH=$(cd $(dirname $0); pwd -P)
BASH_PROFILE="$HOME/.bash_profile"
COMPLETION_ADD=". $SCRIPT_PATH/deepify_comp.sh"
IS_MAC=$(uname -a | grep Darwin)
CURRENT_USER=$(whoami)
NODE_VERSION=$(node -v)
NODE_VERSION="${NODE_VERSION/v/}"

do_version_check() {

   [ "$1" == "$2" ] && return 2

   ver1front=`echo $1 | cut -d "." -f -1`
   ver1back=`echo $1 | cut -d "." -f 2-`

   ver2front=`echo $2 | cut -d "." -f -1`
   ver2back=`echo $2 | cut -d "." -f 2-`

   if [ "$ver1front" != "$1" ] || [ "$ver2front" != "$2" ]; then
       [ "$ver1front" -gt "$ver2front" ] && return 3
       [ "$ver1front" -lt "$ver2front" ] && return 1

       [ "$ver1front" == "$1" ] || [ -z "$ver1back" ] && ver1back=0
       [ "$ver2front" == "$2" ] || [ -z "$ver2back" ] && ver2back=0
       do_version_check "$ver1back" "$ver2back"
       return $?
   else
           [ "$1" -gt "$2" ] && return 3 || return 1
   fi
}

do_version_check "${NODE_VERSION}" "4.2.4"

VERSION_STATUS=$?

if ([ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ] || [ "$OSTYPE" == "msys" ]) && [ $VERSION_STATUS -lt 2 ]; then
   echo "Node ${NODE_VERSION} on Windows doesn’t support prompt! Do you want to use in no interaction mode?[Y/N]"
   read answer
   if echo "$answer" | grep -iq "^y" ;then
     export DEEP_NO_INTERACTION=1
     echo "Added environment variable DEEP_NO_INTERACTION=1 for Windows"
   else
     echo "Please update your node version on Windows to minimum 4.2.4"
   fi
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