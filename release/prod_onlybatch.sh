BRANCH=`git branch --show-current`

if [ "$BRANCH" != "main"  ]; then
    echo "BRANCH: ${BRANCH}"
    echo "NOT PROD"
    exit 1
fi



for var in pfc pfc2 pfc3 pfc4 pfc5
do
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/batch/prod/  $var:/var/www/PopoframeworkSlimCloud/batch/prod/
    ssh $var 'sudo chmod +x   /var/www/PopoframeworkSlimCloud/batch/prod/*.sh'
done
