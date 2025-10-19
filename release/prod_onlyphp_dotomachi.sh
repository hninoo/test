BRANCH=`git branch --show-current`

if [ "$BRANCH" != "develop"  ]; then
    echo "NOT DEVELOP"
    exit 1
fi



cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/


for var in pfc2
do
   #configも設定する場合
      #rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/prod.config.yml $var:/var/www/PopoframeworkSlimCloudDotomachi/config/config.yml

      rsync -av --delete --exclude='files' --exclude='key' --exclude='tmp' --exclude='onpremise' --exclude="tmp" --exclude="redis" --exclude='public' --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudDotomachi/
      rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloudDotomachi/public/api/index.php
      rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:/var/www/PopoframeworkSlimCloudDotomachi/routes/

      #rsync -av --checksum --delete  --exclude="key" --exclude="logs" --exclude="xhprof_result" --exclude='public' --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloudDotomachi/
      #rsync -av --checksum   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloudDotomachi/public/api/index.php
      #rsync -av --checksum   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:/var/www/PopoframeworkSlimCloudDotomachi/routes/


      ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudDotomachi/script.php /cache_clear"
done
