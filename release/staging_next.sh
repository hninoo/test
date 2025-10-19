BRANCH=`git branch --show-current`

if [ "$BRANCH" != "develop"  ]; then
    echo "NOT STAGING"
    exit 1
fi



cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --prod --build-optimizer=true --aot=true ---output-hashing=all

sh staging_onlyphp.sh

for var in pdemo pdemo2
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/


    rsync -av --delete --exclude="logs" --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudNext/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloudNext/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloudNext/public/

    ssh $var 'rm -f /var/www/PopoframeworkSlimCloudNext/tmp_cache/*'

    ssh $var 'php  /var/www/PopoframeworkSlimCloudNext/script.php /cache_clear'
    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudNext/script.php /queue-shutdown"

done

