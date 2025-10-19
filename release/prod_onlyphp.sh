#!/bin/bash

BRANCH=`git branch --show-current`

#check branch is main
if [ "$BRANCH" != "main" ]; then
    echo "You are not on main branch. Please switch to main branch."
    exit 1
fi


read -p "Are you sure you want to deploy to prod? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo "Deployment canceled."
    exit 1
fi

# デプロイするタイプを引数で指定
TYPE=${1:-source}  # デフォルトはsource
RELOAD_APACHE=false  # Apacheリロードフラグ

# サーバーリスト
servers=("pfc2" "pfc3" "pfc4" "pfc6" "pfc7")

# 各サーバーに対して並列に処理を実行
for var in "${servers[@]}"
do
    (
        if [ "$TYPE" == "config" ] || [ "$TYPE" == "all" ]; then
            # configファイルの同期
            rsync -av --checksum  /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/config/prod.config.yml $var:/var/www/PopoframeworkSlimCloud/config/config.yml
            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/prod/private_key.pem $var:/home/ubuntu/key/webhook_private_key.pem
            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/prod/public_key.pem $var:/home/ubuntu/key/webhook_public_key.pem
            #change chmod
            ssh $var "sudo chmod 644 /home/ubuntu/key/webhook_private_key.pem"
            ssh $var "sudo chmod 644 /home/ubuntu/key/webhook_public_key.pem"
        fi

        if [ "$TYPE" == "source" ] || [ "$TYPE" == "all" ]; then
            # ソースコードの同期
            rsync -av --checksum --delete --exclude='key' --exclude='files' --exclude='onpremise' --exclude="tmp" --exclude="redis" --exclude='public' --exclude="logs" --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude="env.sh" --exclude 'vendor' --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4' --exclude='local_batch' --exclude='config.yml' /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/ $var:/var/www/PopoframeworkSlimCloud/
            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/public/api/index.php $var:/var/www/PopoframeworkSlimCloud/public/api/index.php
            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/public/public.php $var:/var/www/PopoframeworkSlimCloud/routes/public/public.php
            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/key/clients/prod/ $var:/var/www/PopoframeworkSlimCloud/key/clients/
        fi

        if [ "$TYPE" == "apache" ] || [ "$TYPE" == "all" ]; then
            # Apache関連の設定同期
            #chmod 755 /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/prod/000-default.conf
            echo $var
            # ssh to /home/ubuntu/000-default.conf and rsync it to /etc/apache2/sites-available/000-default.conf
            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/prod/000-default.conf $var:/home/ubuntu/000-default.conf
            #copy it using sudo
            ssh $var "sudo cp /home/ubuntu/000-default.conf /etc/apache2/sites-available/000-default.conf"
            #rsync -av /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/prod/000-default.conf $var:/etc/apache2/sites-available/000-default.conf
            #rsync -av /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/prod/php.ini $var:/etc/php/8.1/apache2/php.ini
#            rsync -av /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/prod/php.ini $var:/home/ubuntu/php.ini
            ssh $var "sudo cp /home/ubuntu/php.ini /etc/php/8.1/apache2/php.ini"
            RELOAD_APACHE=true
        fi

        if [ "$TYPE" == "all" ]; then
            # 全体デプロイの際に追加の設定ファイルやディレクトリを同期
            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/conf/local.conf $var:~/local.conf
            ssh $var "sudo mv /etc/fonts/local.conf /etc/fonts/local.conf.bk"
            ssh $var "sudo mv ~/local.conf /etc/fonts/local.conf"

            rsync -av --checksum /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/routes/ $var:/var/www/PopoframeworkSlimCloud/routes/

        fi

        # キャッシュクリアとキューシャットダウン
        ssh $var "/usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /cache_clear"
        ssh $var "/usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /queue-shutdown"
    ssh $var "cd /var/www/PopoframeworkSlimCloud/ && composer install"

        # Apacheをリロードするのは、apacheまたはallのときだけ
        if [ "$RELOAD_APACHE" = true ]; then
            ssh $var "sudo service apache2 reload"
        fi
    ) &
done

# 全てのバックグラウンドジョブが終了するまで待機
wait
