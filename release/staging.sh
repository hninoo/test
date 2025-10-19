BRANCH=`git branch --show-current`

#BRANCH staging or develop

if [ "$BRANCH" != "develop" ] && [ "$BRANCH" != "staging" ] && [[ "$BRANCH" != *"devin"* ]]; then
    echo "NOT STAGING"
    exit 1
fi


cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --build-optimizer=true --aot=true ---output-hashing=all

sh staging_onlyphp.sh

for var in pdemo pdemo2
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/

    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloud/'

    rsync -av --delete --exclude="logs" --exclude='tmp' --exclude='onpremise' --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloud/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloud/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloud/public/

    ssh $var "cd /var/www/PopoframeworkSlimCloud/ && composer install"

    ssh $var 'rm -f /var/www/PopoframeworkSlimCloud/tmp_cache/*'

    ssh $var 'php  /var/www/PopoframeworkSlimCloud/script.php /cache_clear'
    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /queue-shutdown"


    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloud/tmp'
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloud/batch/staging'
done

