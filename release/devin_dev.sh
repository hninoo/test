#!/bin/bash

# === 引数チェック ===
if [[ $# -lt 2 ]] || [[ ! "$2" =~ ^[1-5]$ ]]; then
    echo "Usage: $0 <branch_name> {1|2|3|4|5} [slack]"
    exit 1
fi

BRANCH_NAME="$1"
DEPLOY_NUMBER="$2"
SEND_SLACK=false
CURRENT_DIR=$(cd $(dirname $0); pwd)
echo "Current dir: $CURRENT_DIR"

if [[ "$3" == "slack" ]]; then
    SEND_SLACK=true
fi

TARGET_DIR="/Users/yasaipopo/work/pfc_release/devin/pigeon_cloud"
DEPLOY_SCRIPT="/Users/yasaipopo/PhpStormProjects/PopoframeworkSlim/html_angular4/release/dev1-5.sh"
LOG_FILE="$HOME/devin_dev.log"

if [[ "$BRANCH_NAME" == "current" ]]; then
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
    echo "Branch name is set to: $BRANCH_NAME"
fi

# === リポジトリの更新 ===
cd "$TARGET_DIR" || { echo "Failed to change directory"; exit 1; }


git fetch
git reset --hard
git checkout "$BRANCH_NAME" && git pull || { echo "Git operation failed"; exit 1; }

# if git branch is different from the branch name, exit
if [[ $(git rev-parse --abbrev-ref HEAD) != "$BRANCH_NAME" ]]; then
    echo "Failed to checkout branch: $BRANCH_NAME"
    exit 1
fi

# === デプロイ実行 ===
bash "$DEPLOY_SCRIPT" "$DEPLOY_NUMBER" || { echo "Deploy script failed"; exit 1; }

# === Slack通知（slack_send.sh を呼び出し） ===
if $SEND_SLACK; then
    #move to CURRENT_DIR
    cd "$CURRENT_DIR" || { echo "Failed to change directory"; exit 1; }
    bash "send_slack.sh" "$BRANCH_NAME" "$DEPLOY_NUMBER"
fi

# === ログに記録 ===
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
echo "[${TIMESTAMP}] Dev${DEPLOY_NUMBER} に Branch: ${BRANCH_NAME} をデプロイ" >> "$LOG_FILE"
