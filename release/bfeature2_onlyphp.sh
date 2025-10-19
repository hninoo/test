
rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='batch' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ pdemo:/var/www/PopoframeworkSlimCloudDemoFeature2/


rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/load_config.php pdemo:/var/www/vhosts/pigeon_cloud_admin_demo_feature2/load_config.php
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/pw_config.php pdemo:/var/www/vhosts/pigeon_cloud_admin_demo_feature2/pw_config.php

rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/dfeature2.config.yml pdemo:/var/www/vhosts/pigeon_cloud_admin_demo_feature2/config/config.yml

rm -rf dist/

ssh pdemo "cd /var/www/PopoframeworkSlimCloudDemoFeature2 && composer install"

#ssh pdemo "pkill -f 'pigeon_cloud_admin_demo_feature2'"

ssh pdemo "sudo chmod -R 777 /tmp/pfc_cache/ && /usr/bin/php /var/www/vhosts/pigeon_cloud_admin_demo_feature2/script.php /cache_clear_all"
