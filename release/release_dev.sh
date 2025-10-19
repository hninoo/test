

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

rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='.idea' --exclude='batch' --exclude='html_angular4' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ amav2:/var/www/PopoframeworkSlimCloudDev/
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/dist/ amav2:/var/www/vhosts/pigeon_cloud_admin_dev/

rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/load_config.php amav2:/var/www/vhosts/pigeon_cloud_admin_dev/load_config.php
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/test.config.yml amav2:/var/www/vhosts/pigeon_cloud_admin_dev/config/config.yml

ssh amav2 "cd /var/www/PopoframeworkSlimCloud && composer install"
