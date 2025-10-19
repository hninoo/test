BRANCH=`git branch --show-current`

if [ "$BRANCH" != "develop" -a "$BRANCH" != "staging"   -a "$BRANCH" != "feature/reminder_job" ]; then
    echo "NOT STAGING"
    exit 1
fi




cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/
#git checkout cloud-prod


cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --prod --build-optimizer=true --aot=true ---output-hashing=all

for var in pdemo
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/


    rsync -av --delete  --exclude='Angular5_CLI_Full_Project' --exclude="logs" --exclude='key' --exclude='vendor' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:~/pigeon_framework/
    rsync -av dist/ $var:~/pigeon_framework/public/
    rsync -av .htaccess $var:~/pigeon_framework/public/

    ssh $var 'rm -f ~/pigeon_framework/tmp_cache/*'

    ssh $var 'cd ~/pigeon_framework/docker && docker-compose exec pfc_work php /var/www/html/script.php /cache_clear'

done

