BRANCH=`git branch --show-current`

if [ "$BRANCH" != "develop" -a "$BRANCH" != "staging" -a "$BRANCH" != "feature/reminder_job"  ]; then
    echo "NOT STAGING"
    exit 1
fi


for var in pdemo pdemo2
do
    ssh $var "sudo chmod -R 777 /var/www/PopoframeworkSlimCloud"

    rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/staging.config.yml $var:~/pigeon_framework/config/config.yml

    rsync -av --delete --exclude='xhprof_result' --exclude="redis" --exclude="logs" --exclude='public' --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:~/pigeon_framework/
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:~/pigeon_framework/public/api/index.php
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:~/pigeon_framework/routes/

    rsync -av --delete  --exclude=".env" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/docker/ $var:~/pigeon_framework/docker/

    ssh $var "cd ~/pigeon_framework/docker && docker-compose exec pfc_work php /var/www/html/script.php /cache_clear"
    ssh $var "cd ~/pigeon_framework/docker && docker-compose exec pfc_work php /var/www/html/script.php queue-shutdown"

    ssh $var "cd ~/pigeon_framework/docker && docker-compose exec chmod -R 777 /var/www/html/xhprof_result"
done

