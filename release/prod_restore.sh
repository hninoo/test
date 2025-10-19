read -p "are you sure to deploy prod restore?:"
BRANCH=`git branch --show-current`

if [ "$BRANCH" != "staging"  ]; then
    echo "NOT PROD"
    exit 1
fi


#rsync -av pfc:/var/www/PopoframeworkSlimCloudRestore/ /tmp/pfc_bk/

cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/
#git checkout cloud-prod


cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

#rm -rf dist
#ng build -c release_internal --prod --build-optimizer=true --aot=true ---output-hashing=all


for var in pfc
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/

    rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/restore.config.yml $var:/var/www/PopoframeworkSlimCloudRestore/config/config.yml

    rsync -av --delete --exclude="logs" --exclude='files' --exclude="onpremise"  --exclude="tmp" --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudRestore/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloudRestore/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloudRestore/public/

    ssh $var "cd /var/www/PopoframeworkSlimCloudRestore/ && composer install"
    ssh $var 'rm -f /var/www/PopoframeworkSlimCloudRestore/tmp_cache/*'
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudRestore/tmp'

done

