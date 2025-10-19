BRANCH=`git branch --show-current`

if [ "$BRANCH" != "main-next"  ]; then
    echo "NOT PROD NEXT"
    exit 1
fi



cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --build-optimizer=true --aot=true ---output-hashing=all


for var in pfc2 pfc3 pfc4 pfc6 pfc7
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/


    rsync -av --delete --exclude="logs" --exclude='files' --exclude='tmp' --exclude='onpremise' --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudNext/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloudNext/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloudNext/public/

    ssh $var "cd /var/www/PopoframeworkSlimCloudNext/ && composer install"
    ssh $var 'rm -f /var/www/PopoframeworkSlimCloudNext/tmp_cache/*'

    ssh $var 'php  /var/www/PopoframeworkSlimCloudNext/script.php /cache_clear'
    #ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudNext/script.php /queue-shutdown"
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudNext/tmp'

done
