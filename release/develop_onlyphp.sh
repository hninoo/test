echo "START"
BRANCH=`git branch --show-current`




for var in pdemo pdemo2
do
    (
    echo $var
    #ssh $var " sudo chown -R ubuntu:ubuntu /var/www/PopoframeworkSlimCloudDev"
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/staging/000-default.conf  $var:/etc/apache2/sites-available/000-default.conf
    ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudDev/'

    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/xhprof-html/  $var:/var/www/PopoframeworkSlimCloudDev/public/xhprof-html/

    #configも設定する場合
    #rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/develop.config.yml $var:/var/www/PopoframeworkSlimCloudDev/config/config.yml

    rsync -av --delete --exclude='key' --exclude='onpremise' --exclude='tmp' --exclude="redis" --exclude='public' --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4'  --exclude='local_batch' --exclude='config.yml'  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/Application/ $var:/var/www/PopoframeworkSlimCloudDev/Application/
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php  $var:/var/www/PopoframeworkSlimCloudDev/public/api/index.php
    rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/  $var:/var/www/PopoframeworkSlimCloudDev/routes/

        #rsync -av /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/staging/php.ini $var:/home/ubuntu/php.ini
        #ssh $var "sudo cp /home/ubuntu/php.ini /etc/php/8.4/apache2/php.ini"

    #rsync -av   /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/clients/staging/  $var:/var/www/PopoframeworkSlimCloudDev/key/clients/
    #ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudDev/script.php /cache_clear"
    ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloudDev/script.php /queue-shutdown"

    #ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudDev/tmp'
    #ssh $var 'sudo chmod -R 777  /var/www/PopoframeworkSlimCloudDev/batch/staging'
            ssh $var "sudo service apache2 reload"
    ) &
done

wait


#rsync -av  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/clients/prod/  pdemo2:/var/www/PopoframeworkSlimCloudDev/key/clients/
