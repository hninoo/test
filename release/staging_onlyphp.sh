BRANCH=`git branch --show-current`

if [ "$BRANCH" != "develop" ] && [ "$BRANCH" != "staging" ] && [[ "$BRANCH" != *"devin"* ]]; then
    echo "NOT STAGING"
    exit 1
fi


read -p "are you sure to deploy staging?:"

for var in pdemo2
do (
#    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/staging/  $var:/home/ubuntu/key/
#    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/develop/  $var:/home/ubuntu/key_develop/
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloud/'
#    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/sp*  $var:~/pfc/key/


#    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/xhprof-html/  $var:/var/www/PopoframeworkSlimCloud/public/xhprof-html/

    ##apache
    #rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/staging/000-default.conf  $var:/etc/apache2/sites-available/000-default.conf
#    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/staging/000-default-le-ssl.conf  $var:/etc/apache2/sites-available/000-default-le-ssl.conf
#
#        rsync -av /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/staging/php.ini $var:/home/ubuntu/php.ini
#        ssh $var "sudo cp /home/ubuntu/php.ini /etc/php/8.4/apache2/php.ini"
#        rsync -av /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/staging/php.cli.ini $var:/home/ubuntu/php.cli.ini
#        ssh $var "sudo cp /home/ubuntu/php.cli.ini /etc/php/8.4/cli/php.ini"

    ##configも設定する場合
    #rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/staging.config.yml $var:/var/www/PopoframeworkSlimCloud/config/config.yml

    rsync -av --delete --exclude='key' --exclude='onpremise' --exclude='tmp' --exclude="redis" --exclude='public' --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloud/
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloud/public/api/index.php
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/lib/  $var:/var/www/PopoframeworkSlimCloud/lib/
    #rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:/var/www/PopoframeworkSlimCloud/routes/

    #rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/clients/staging/  $var:/var/www/PopoframeworkSlimCloud/key/clients/
#    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /cache_clear"
#    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /queue-shutdown"

    #ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloud/tmp'
    #ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloud/batch/staging'
#    ssh $var "sudo service apache2 reload"
    ) &
done

wait


#rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/clients/prod/  pdemo2:/var/www/PopoframeworkSlimCloud/key/clients/
