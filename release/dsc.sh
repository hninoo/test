read -p "are you sure to deploy dsc prod?:"

cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4
#sed -i".bak" -e 's$href="/"$href="__ADMIN_PATH__"$' src/index.html
#git checkout src/index.html

rm -rf dist
ng build -c release_internal

if [ ! -d "dist" ]; then
    echo "build failed"
     exit
fi
cp .htaccess dist/


for var in chukyopfc
do

rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='batch' --exclude='.idea' --exclude='html_angular4' --exclude='batch' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloud/

rsync -av  --exclude 'vendor'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/dist/ $var:/var/www/vhosts/pigeon_cloud_admin/

rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/load_config.php $var:/var/www/vhosts/pigeon_cloud_admin/load_config.php

rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/dsc.config.yml $var:/var/www/vhosts/pigeon_cloud_admin/config/config.yml

ssh $var "cd /var/www/PopoframeworkSlimCloud && composer install"
done


rm -rf dist/

