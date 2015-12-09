__deepify_comp() {
    local PREV_WORD
    local CUR_WORD
    local SCRIPT_PATH

    SCRIPT_PATH=$(cd $(dirname "${BASH_SOURCE[0]}"); pwd -P)

    PREV_WORD="${COMP_WORDS[COMP_CWORD-1]}"
    CUR_WORD="${COMP_WORDS[COMP_CWORD]}"

    if [ "$PREV_WORD" != "deepify" ]; then
        COMPREPLY=($(compgen -f ${CUR_WORD}))
        return 0
    fi

    COMPREPLY=($("${SCRIPT_PATH}"/../bin/deepify.js --cmd-auto-complete -- "$CUR_WORD"))

    return 0
}

complete -F __deepify_comp deepify 2>/dev/null
