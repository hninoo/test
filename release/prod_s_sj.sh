read -p "are you sure to deploy prodssj?:"
BRANCH=`git branch --contains=HEAD`


#rsync -av pfc:/var/www/PopoframeworkSlimCloud/ /tmp/pfc_bk/

cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/
#git checkout cloud-prod


cd /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4

rm -rf dist
ng build -c release_internal --prod --build-optimizer=true --aot=true ---output-hashing=all


for var in pfcssj
do
    rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/prod.config.yml $var:/var/www/PopoframeworkSlimCloud/config/config.yml

    rsync -av --delete --exclude='public' --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloud/
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloud/public/api/index.php
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:/var/www/PopoframeworkSlimCloud/routes/

done


for var in pfcssj
do
    if [ ! -d "dist" ]; then
        echo "build failed"
         exit
    fi
    cp .htaccess dist/


    rsync -av --delete  --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloud/
    rsync -av dist/ $var:/var/www/PopoframeworkSlimCloud/public/
    rsync -av .htaccess $var:/var/www/PopoframeworkSlimCloud/public/

    ssh $var 'rm -f /var/www/PopoframeworkSlimCloud/tmp_cache/*'

    ssh $var 'php  /var/www/PopoframeworkSlimCloud/script.php /cache_clear'

done

