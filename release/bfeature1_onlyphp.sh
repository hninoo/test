
rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='batch' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ pdemo:/var/www/PopoframeworkSlimCloudDemoFeature1/


rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/load_config.php pdemo:/var/www/vhosts/pigeon_cloud_admin_demo_feature1/load_config.php
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/pw_config.php pdemo:/var/www/vhosts/pigeon_cloud_admin_demo_feature1/pw_config.php

rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/dfeature1.config.yml pdemo:/var/www/vhosts/pigeon_cloud_admin_demo_feature1/config/config.yml

rm -rf dist/

ssh pdemo "cd /var/www/PopoframeworkSlimCloudDemoFeature1 && composer install"

#ssh pdemo "pkill -f 'pigeon_cloud_admin_demo_feature1'"

ssh pdemo "sudo chmod -R 777 /tmp/pfc_cache/ && /usr/bin/php /var/www/vhosts/pigeon_cloud_admin_demo_feature1/script.php /cache_clear_all"
