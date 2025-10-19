#!/bin/bash

cd  /Users/yasaipopo/work/pfc_release/devin/pigeon_cloud
# 引数チェック
if [[ $# -ne 1 ]] || [[ ! "$1" =~ ^[1-5]$ ]]; then
    echo "Usage: $0 {1|2|3|4|5}"
    exit 1
fi

X=$1
TARGET_DIR="PopoframeworkSlimCloudDev${X}"

BRANCH=$(git branch --show-current)

# BRANCH devin/ から始まるか、または develop かチェック
#if [[ ! "$BRANCH" =~ ^devin/ && "$BRANCH" != "develop" ]]; then
#    echo "NOT A VALID BRANCH"
#    exit 1
#fi

# git pull origin develop / and if failed , exit
#git pull origin develop || exit 1

#git push origin "$BRANCH"

#checkout
git checkout "$BRANCH" || exit 1


cd /Users/yasaipopo/work/pfc_release/devin/pigeon_cloud/html_angular4 || exit 1

rm -rf dist
npm install --legacy-peer-deps
ng build -c release_internal --build-optimizer=true --aot=true --output-hashing=all

for var in pdemo pdemo2
do
    if [ ! -d "dist" ]; then
        echo "build failed"
        exit 1
    fi

    cp .htaccess dist/

    # mkdirでディレクトリを作成
    ssh "$var" "mkdir -p /var/www/${TARGET_DIR}/tmp"

    # configも設定する場合
    rsync -av /Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/config/develop.config.yml \
          "$var:/var/www/${TARGET_DIR}/config/config.yml"

    # SSH で sed を実行し、Dev => DevX に変更
    #ssh "$var" "sed -i \"\" 's/redis-db: 12/redis-db: ${Xnew}/g' \"/var/www/${TARGET_DIR}/config/config.yml\""

    #replace redis-db: 12 => redis-db: 12+X
    Xnew=`expr 12 + $X`
    expect <<EOF
    spawn ssh "$SSH_HOST"

    # "ubuntu" という文字が表示されるのを待つ
    expect <<EOF
    spawn ssh "$var"
    expect "ubuntu"

    send -- "sed -i 's/redis-db: 12/redis-db: ${Xnew}/g' /var/www/${TARGET_DIR}/config/config.yml\r"
    sleep 1

    #Dev => DevX
    send -- "sed -i 's/Dev/Dev${X}/g' /var/www/${TARGET_DIR}/config/config.yml\r"
    sleep 1

    send -- "exit\r"
    expect eof
EOF


    rsync -av --delete --exclude="logs" --exclude="*.log" --exclude='tmp' --exclude='onpremise' \
          --exclude="local_batch" --exclude='key' --exclude="clients" --exclude="logs" \
          --exclude='Angular5_CLI_Full_Project' --exclude='uml' --exclude='tests' --exclude 'vendor' \
          --exclude='docker' --exclude='.git' --exclude='.idea' --exclude='html_angular4' \
          --exclude='config.yml' /Users/yasaipopo/work/pfc_release/devin/pigeon_cloud/ "$var:/var/www/${TARGET_DIR}/"

    rsync -av dist/ "$var:/var/www/${TARGET_DIR}/public/"
    rsync -av .htaccess "$var:/var/www/${TARGET_DIR}/public/"

    ssh "$var" "cd /var/www/${TARGET_DIR}/ && composer install"

    ssh "$var" "rm -f /var/www/${TARGET_DIR}/tmp_cache/*"
    ssh "$var" "php /var/www/${TARGET_DIR}/script.php /cache_clear"
    ssh "$var" "/usr/bin/php /var/www/${TARGET_DIR}/script.php /queue-shutdown"

    ssh "$var" "sudo chmod -R 777 /var/www/${TARGET_DIR}/tmp"
    #ssh "$var" "sudo chmod -R 777 /var/www/${TARGET_DIR}/batch/staging"
done
