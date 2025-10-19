sh beta_onlyphp.sh
cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --prod --build-optimizer=true --aot=true ---output-hashing=all

if [ ! -d "dist" ]; then
    echo "build failed"
     exit
fi
cp .htaccess dist/


rsync -av --delete  --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ pdemo:/var/www/PopoframeworkSlimCloud/
rsync -av dist/ pdemo:/var/www/PopoframeworkSlimCloud/public/
rsync -av .htaccess pdemo:/var/www/PopoframeworkSlimCloud/public/

ssh pdemo 'php  /var/www/PopoframeworkSlimCloud/script.php /cache_clear_all'

