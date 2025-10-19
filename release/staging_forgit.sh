BRANCH=`git branch --show-current`

if [ "$BRANCH" != "staging"  ]; then
    echo "NOT STAGING"
    exit 1
fi


cd  /Users/yasaipopo/PhpStormProjects/pfc_forgit
sh release.sh develop
