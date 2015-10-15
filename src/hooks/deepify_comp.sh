__deepify_comp() {
    local PREV_WORD
    local CUR_WORD

    PREV_WORD="${COMP_WORDS[COMP_CWORD-1]}"
    CUR_WORD="${COMP_WORDS[COMP_CWORD]}"

    if [ "$PREV_WORD" != "deepify" ]; then
        COMPREPLY=($(compgen -f -o plusdirs -- ${CUR_WORD}))
        return 0
    fi

    COMPREPLY=()

    case "$CUR_WORD" in
        '')
            COMPREPLY+=('server' 'helloworld' 'lambda' 'deploy' 'undeploy' 'pull-deps' 'push-deps' 'build-frontend')
            ;;
        b*)
            COMPREPLY+=('build-frontend')
            ;;
        s*)
            COMPREPLY+=('server')
            ;;
        h*)
            COMPREPLY+=('helloworld')
            ;;
        l*)
            COMPREPLY+=('lambda')
            ;;
        d*)
            COMPREPLY+=('deploy')
            ;;
        u*)
            COMPREPLY+=('undeploy')
            ;;
        pul*)
            COMPREPLY+=('pull-deps')
            ;;
        pus*)
            COMPREPLY+=('push-deps')
            ;;
        p*)
            COMPREPLY+=('pull-deps')
            COMPREPLY+=('push-deps')
            ;;
    esac

    return 0
}

complete -F __deepify_comp deepify 2>/dev/null
