
cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/
#git checkout cloud-prod-persol
BRANCH_NAME=`git rev-parse --abbrev-ref HEAD `

echo ${BRANCH_NAME}

if [ ${BRANCH_NAME} == "main-next" ]
then
    echo "Equal"
else
    echo "Not Correct Branch"
    exit 0;
fi

read -p "[NEXT] are you sure to deploy prod next?:"

for var in pfc2 pfc3 pfc4 pfc6 pfc7
do (

    #configも設定する場合
    # `rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/prod/000-default.conf  $var:/etc/apache2/sites-available/000-default.conf
    rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/prodnext.config.yml $var:/var/www/PopoframeworkSlimCloudNext/config/config.yml

    rsync -av --delete --exclude='*.out' --exclude='files' --exclude='key' --exclude='tmp' --exclude='onpremise' --exclude="tmp" --exclude="redis" --exclude='public' --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudNext/
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloudNext/public/api/index.php
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:/var/www/PopoframeworkSlimCloudNext/routes/
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/lib/  $var:/var/www/PopoframeworkSlimCloudNext/lib/

    #rsync -av --checksum --delete  --exclude="key" --exclude="logs" --exclude="xhprof_result" --exclude='public' --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudNext/


    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudNext/script.php /cache_clear"
    #ssh $var "cd /var/www/PopoframeworkSlimCloudNext/ && rm -rf vendor"
    ssh $var "cd /var/www/PopoframeworkSlimCloudNext/ && composer install"
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudNext/tmp'

    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudNext/script.php /queue-shutdown"
    ssh $var " sudo service apache2 reload"
    ) &
done




wait
