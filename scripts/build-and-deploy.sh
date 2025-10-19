#!/bin/bash

# Angular アプリケーションをビルドして、CDN用に設定を書き換え、S3にアップロードする統合スクリプト
# 
# 使用方法:
# ./scripts/build-and-deploy.sh <environment>
# 
# 例:
# ./scripts/build-and-deploy.sh staging
# ./scripts/build-and-deploy.sh pigeon_demo

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Error: Environment is required"
    echo "Usage: ./scripts/build-and-deploy.sh <environment>"
    echo "Available environments: staging, develop, production, demo, pigeon_demo"
    exit 1
fi

echo "================================"
echo "Building and deploying for environment: $ENVIRONMENT"
echo "================================"

# 1. Angularアプリケーションをビルド
echo ""
echo "Step 1: Building Angular application..."
echo "--------------------------------"

# 環境名のマッピング（Angularの環境名とスクリプトの環境名が異なる場合）
case "$ENVIRONMENT" in
    "staging")
        NG_ENV="pigeon_demo"
        ;;
    "demo")
        NG_ENV="pigeon_demo"
        ;;
    *)
        NG_ENV=$ENVIRONMENT
        ;;
esac

# ビルドコマンドを実行
if [ -f "angular.json" ]; then
    echo "Running: ng build -c $NG_ENV --prod"
    ng build -c $NG_ENV --prod
else
    echo "Error: angular.json not found. Please run this script from the html_angular4 directory."
    exit 1
fi

echo "Build completed successfully!"

# 2. index.htmlのURLをCDN用に書き換え
echo ""
echo "Step 2: Rewriting asset URLs for CDN..."
echo "--------------------------------"

node scripts/rewrite-cdn-urls.js $ENVIRONMENT

# 3. 静的アセットをS3にアップロード
echo ""
echo "Step 3: Uploading static assets to S3..."
echo "--------------------------------"

./scripts/upload-to-s3.sh $ENVIRONMENT

# 4. index.htmlをECS用にコピー
echo ""
echo "Step 4: Preparing index.html for ECS deployment..."
echo "--------------------------------"

# ECSデプロイ用のディレクトリを作成
ECS_DEPLOY_DIR="../public"
if [ ! -d "$ECS_DEPLOY_DIR" ]; then
    mkdir -p $ECS_DEPLOY_DIR
fi

# index.htmlをECSデプロイ用ディレクトリにコピー
cp dist/index.html $ECS_DEPLOY_DIR/index.html
echo "index.html copied to $ECS_DEPLOY_DIR"

# 5. 完了メッセージ
echo ""
echo "================================"
echo "Deployment completed successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Deploy the ECS application with the updated index.html"
echo "2. Update Route53 to point to the ALB (if not already done)"
echo "3. Test the application at your domain"
echo ""
echo "Configuration summary:"
echo "- Environment: $ENVIRONMENT"
echo "- Angular build config: $NG_ENV"
if [ -f "dist/cdn-config.json" ]; then
    echo "- CDN URL: $(cat dist/cdn-config.json | grep '"cdnUrl"' | cut -d'"' -f4)"
fi
echo ""