BRANCH=`git branch --show-current`

if [ "$BRANCH" != "cloud-prod"  ]; then
    echo "NOT PROD"
    exit 1
fi


read -p "are you sure to deploy prod?:"

for var in pfc
do


    #configも設定する場合
    rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/restore.config.yml $var:/var/www/PopoframeworkSlimCloudRestore/config/config.yml

    rsync -av --delete --exclude='key' --exclude='files' --exclude='onpremise' --exclude="tmp" --exclude="redis" --exclude='public' --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudRestore/
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloudRestore/public/api/index.php
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/pw_config.php  $var:/var/www/PopoframeworkSlimCloudRestore/public/pw_config.php

    #rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/clients/prod/  $var:/var/www/PopoframeworkSlimCloudRestore/key/clients/
done


wait

for var in pfc2 pfc pfc3 pfc4 pfc5
do
    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudRestore/script.php /cache_clear"
  ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudRestore/script.php /queue-shutdown"

    ssh $var " sudo chmod -R 777 /var/www/PopoframeworkSlimCloudRestore/logs"
    ssh $var " sudo mkdir /var/www/PopoframeworkSlimCloudRestore/tmp"
    ssh $var " sudo chmod -R 777 /var/www/PopoframeworkSlimCloudRestore/tmp"
done

wait
