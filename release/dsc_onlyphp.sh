read -p "are you sure to deploy dsc prod?:"

rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='.idea' --exclude='html_angular4' --exclude='batch' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ chukyopfc:/var/www/PopoframeworkSlimCloud/
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/load_config.php chukyopfc:/var/www/vhosts/pigeon_cloud_admin/load_config.php


ssh chukyopfc "cd /var/www/PopoframeworkSlimCloud && composer install"
