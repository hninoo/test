
rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='.idea' --exclude='html_angular4' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes_script/ pfc:/var/www/PopoframeworkSlimCloudDemo/routes_script/
rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='.idea' --exclude='html_angular4' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes_script/ pfc2:/var/www/PopoframeworkSlimCloudDemo/routes_script/


ssh pfc "cd /var/www/PopoframeworkSlimCloudDemo && composer install"
ssh pfc2 "cd /var/www/PopoframeworkSlimCloudDemo && composer install"
