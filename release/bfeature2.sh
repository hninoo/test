cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4
#sed -i".bak" -e 's$href="/"$href="__ADMIN_PATH__"$' src/index.html
#git checkout src/index.html

rm -rf dist
ng build -c release_internal --prod

if [ ! -d "dist" ]; then
    echo "build failed"
     exit
fi
cp .htaccess dist/


rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/dist/ pdemo:/var/www/vhosts/pigeon_cloud_admin_demo_feature2/


cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release
sh bfeature2_onlyphp.sh

#rm -rf dist/

ssh pdemo "cd /var/www/PopoframeworkSlimCloudDemoFeature2 && composer install"

