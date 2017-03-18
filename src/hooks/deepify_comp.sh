#!/usr/bin/env bash
# This script is autogenrated by deepify. DO NOT CHANGE IT MANUALLY!!!
__deepify_comp() {
    local CUR_WORD

    CUR_WORD="${COMP_WORDS[COMP_CWORD]}"

    
          if [ "${COMP_WORDS[0]}" = "deepify" ]; then
              if [ "${COMP_WORDS[1]}" = "registry" ]; then
        
        if [ "${COMP_CWORD}" -eq "2" ]; then
          WORDS=( "publish"  "config" )

          if [ "${CUR_WORD}" = "registry" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
          if [ "${COMP_WORDS[1]}" = "compile" ]; then
        
        if [ "${COMP_CWORD}" -eq "2" ]; then
          WORDS=( "frontend"  "es6"  "prod"  "dev" )

          if [ "${CUR_WORD}" = "compile" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
          if [ "${COMP_WORDS[1]}" = "generate" ]; then
              if [ "${COMP_WORDS[2]}" = "backend" ]; then
        
        if [ "${COMP_CWORD}" -eq "3" ]; then
          WORDS=( "action"  "resource" )

          if [ "${CUR_WORD}" = "backend" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
          if [ "${COMP_WORDS[2]}" = "data" ]; then
        
        if [ "${COMP_CWORD}" -eq "3" ]; then
          WORDS=( "model"  "migration" )

          if [ "${CUR_WORD}" = "data" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
          if [ "${COMP_WORDS[2]}" = "test" ]; then
        
        if [ "${COMP_CWORD}" -eq "3" ]; then
          WORDS=( "backend"  "frontend" )

          if [ "${CUR_WORD}" = "test" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
    
        if [ "${COMP_CWORD}" -eq "2" ]; then
          WORDS=( "microapp"  "frontend"  "backend"  "data"  "test" )

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

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
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

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
          if [ "${COMP_WORDS[1]}" = "replicate" ]; then
        
        if [ "${COMP_CWORD}" -eq "2" ]; then
          WORDS=( "stop"  "start"  "prepare"  "status" )

          if [ "${CUR_WORD}" = "replicate" ]; then
            COMPREPLY=WORDS;

            return 0;
          fi;

          for WORD in ${WORDS[@]}; do
            if [[ ${WORD} == "${CUR_WORD}"* ]]; then
              COMPREPLY+=(${WORD});
            fi
          done;
        fi

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
    
        if [ "${COMP_CWORD}" -eq "1" ]; then
          WORDS=( "helloworld"  "update"  "install"  "server"  "deploy"  "undeploy"  "registry"  "compile"  "lambda"  "list"  "generate"  "ssl"  "replicate"  "publish" )

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

        if [ ${#COMPREPLY[@]} -eq 0 ] && [[ "${CUR_WORD}" != '-'* ]]; then
          COMPREPLY=($(compgen -f ${CUR_WORD}))
        fi

        return 0;
      fi
    

    return 0
}

complete -F __deepify_comp deepify 2>/dev/null
