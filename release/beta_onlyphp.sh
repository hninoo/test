rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/demo.config.yml pdemo:/var/www/PopoframeworkSlimCloud/config/config.yml

rsync -av --delete --exclude='public' --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ pdemo:/var/www/PopoframeworkSlimCloud/

ssh pdemo 'cd /var/www/PopoframeworkSlimCloud && composer install'

ssh pdemo "pkill -f 'PopoframeworkSlimCloud'"

ssh pdemo " /usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /cache_clear_all"
