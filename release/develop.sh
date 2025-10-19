BRANCH=`git branch --show-current`

#BRANCH staging or develop
if [ "$BRANCH" != "develop" ]; then
    echo "NOT DEVELOP"
    exit 1
fi



cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --build-optimizer=true --aot=true ---output-hashing=all


for var in pdemo pdemo2
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/


    rsync -av --delete --exclude="logs" --exclude='tmp' --exclude='onpremise' --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudDev/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloudDev/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloudDev/public/

    ssh $var "cd /var/www/PopoframeworkSlimCloudDev/ && composer install"

    ssh $var 'rm -f /var/www/PopoframeworkSlimCloudDev/tmp_cache/*'

    ssh $var 'php  /var/www/PopoframeworkSlimCloudDev/script.php /cache_clear'
    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudDev/script.php /queue-shutdown"


    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudDev/tmp'
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudDev/batch/staging'
done

