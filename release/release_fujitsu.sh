

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

rsync -av --delete --exclude 'vendor' --exclude='.git' --exclude='.idea' --exclude='html_angular4' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ fuji:/var/www/PopoframeworkSlimCloud/
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/dist/ fuji:/var/www/html/

rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/load_config.php fuji:/var/www/html/load_config.php
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/pw_config.php fuji:/var/www/html/pw_config.php
rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/root/index.php fuji:/var/www/html/index.php

ssh fuji "cd /var/www/PopoframeworkSlimCloud && composer install"
