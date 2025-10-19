BRANCH=`git branch --show-current`

if [ "$BRANCH" != "staging"  ]; then
    echo "BRANCH: ${BRANCH}"
    echo "NOT PROD"
    exit 1
fi



for var in pdemo pdemo2
do
    rsync -av --exclude="dump*.sql"  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/batch/staging/  $var:/var/www/batch/
    ssh $var 'sudo chmod -R 777   /var/www/batch'

    ssh $var 'sudo chmod +x   /var/www/batch/*.sh'
done
