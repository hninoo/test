read -p "are you sure to deploy prod?:"
BRANCH=`git branch --show-current`

if [ "$BRANCH" != "main"  ]; then
    echo "NOT PROD"
    exit 1
fi



#rsync -av pfc:/var/www/PopoframeworkSlimCloud/ /tmp/pfc_bk/

cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/
#git checkout cloud-prod


cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --prod --build-optimizer=true --aot=true ---output-hashing=all

sh prod_onlyphp.sh

for var in pfc2 pfc3 pfc4 pfc6 pfc7
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/


    rsync -av  --checksum --delete --exclude="logs" --exclude='files' --exclude="onpremise"  --exclude="tmp" --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloud/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloud/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloud/public/

    ssh $var "cd /var/www/PopoframeworkSlimCloud/ && composer install"

    ssh $var 'rm -f /var/www/PopoframeworkSlimCloud/tmp_cache/*'

    #ssh $var 'php  /var/www/PopoframeworkSlimCloud/script.php /cache_clear'
    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /queue-shutdown"
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloud/tmp'

done

