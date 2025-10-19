
cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/
#git checkout cloud-prod-persol
BRANCH_NAME=`git rev-parse --abbrev-ref HEAD `

echo ${BRANCH_NAME}

if [ ${BRANCH_NAME} == "cloud-prod-persol" ]
then
    echo "Equal"
else
    echo "Not Correct Branch"
    exit 0;
fi

read -p "[PERSOL] are you sure to deploy prod persol?:"

for var in pfc pfc2 pfc3
do

    #configも設定する場合
    #rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/prod.config.yml $var:/var/www/PopoframeworkSlimCloudPersol/config/config.yml

    rsync -av --checksum --delete  --exclude="key" --exclude="logs" --exclude="xhprof_result" --exclude='public' --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudPersolStaging/
    rsync -av --checksum   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloudPersolStaging/public/api/index.php
    rsync -av --checksum   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:/var/www/PopoframeworkSlimCloudPersolStaging/routes/



    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudPersolStaging/script.php /cache_clear"

done


