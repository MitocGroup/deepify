#!/usr/bin/env bash
# Created on 05/12/2016 11:38:46 AM
__deepify_comp() {
    local PREV_WORD
    local CUR_WORD
    local SCRIPT_PATH

    CUR_WORD="${COMP_WORDS[COMP_CWORD]}"

    
          if [ "${COMP_WORDS[0]}" = "deepify" ]; then
                        if [ "${COMP_WORDS[1]}" = "generate" ]; then
                          
        if [ "${COMP_CWORD}" -eq "2" ]; then
          WORDS=( "microapp"  "model"  "action"  "migration" )

          if [ "${CUR_WORD}" = "generate" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
          if [ "${COMP_WORDS[1]}" = "ssl" ]; then
                          
        if [ "${COMP_CWORD}" -eq "2" ]; then
          WORDS=( "enable"  "disable" )

          if [ "${CUR_WORD}" = "ssl" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
            
        if [ "${COMP_CWORD}" -eq "1" ]; then
          WORDS=( "helloworld"  "install"  "server"  "deploy"  "undeploy"  "publish"  "registry-cfg"  "build-frontend"  "compile-es6"  "compile-prod"  "create-migration"  "init-backend"  "run-lambda"  "list"  "generate"  "ssl" )

          if [ "${CUR_WORD}" = "deepify" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
    

    return 0
}

complete -F __deepify_comp deepify 2>/dev/null
