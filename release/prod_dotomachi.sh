BRANCH=`git branch --show-current`

if [ "$BRANCH" != "develop"  ]; then
    echo "NOT DEVELOP"
    exit 1
fi



cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --prod --build-optimizer=true --aot=true ---output-hashing=all


for var in pfc2
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/


    rsync -av --delete --exclude="logs" --exclude='files' --exclude='tmp' --exclude='onpremise' --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudDotomachi/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloudDotomachi/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloudDotomachi/public/

    ssh $var "cd /var/www/PopoframeworkSlimCloudDotomachi/ && composer install"
    ssh $var 'rm -f /var/www/PopoframeworkSlimCloudDotomachi/tmp_cache/*'

    ssh $var 'php  /var/www/PopoframeworkSlimCloudDotomachi/script.php /cache_clear'
    #ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudDotomachi/script.php /queue-shutdown"
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudDotomachi/tmp'

done
