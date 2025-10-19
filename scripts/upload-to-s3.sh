#!/bin/bash

# S3に静的アセットをアップロードするスクリプト
# 
# 使用方法:
# ./scripts/upload-to-s3.sh <environment>
# 
# 環境変数:
# AWS_PROFILE - 使用するAWSプロファイル
# S3_BUCKET - アップロード先のS3バケット

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Error: Environment is required"
    echo "Usage: ./scripts/upload-to-s3.sh <environment>"
    exit 1
fi

# 環境ごとのS3バケット設定
case "$ENVIRONMENT" in
    "staging"|"demo"|"pigeon_demo")
        S3_BUCKET=${S3_BUCKET:-"staging-pigeoncloud-front"}
        AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
        ;;
    "develop")
        S3_BUCKET=${S3_BUCKET:-"develop-pigeoncloud-front"}
        AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
        ;;
    "production")
        S3_BUCKET=${S3_BUCKET:-"prod-pigeoncloud-front"}
        AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "Uploading to S3 bucket: $S3_BUCKET"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"

# distディレクトリが存在するか確認
if [ ! -d "dist" ]; then
    echo "Error: dist directory not found. Please run 'ng build' first."
    exit 1
fi

# index.htmlは除外して、その他のファイルをS3にアップロード
echo "Uploading JavaScript files..."
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --exclude "index.html*" \
    --exclude "cdn-config.json" \
    --include "*.js" \
    --cache-control "public, max-age=31536000, immutable" \
    --content-type "application/javascript" \
    --region $AWS_REGION

echo "Uploading CSS files..."
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --exclude "*" \
    --include "*.css" \
    --cache-control "public, max-age=31536000, immutable" \
    --content-type "text/css" \
    --region $AWS_REGION

echo "Uploading assets..."
aws s3 sync dist/assets/ s3://$S3_BUCKET/assets/ \
    --cache-control "public, max-age=86400" \
    --region $AWS_REGION

echo "Static assets uploaded successfully to S3"

# CORS設定を更新
echo "Updating S3 CORS configuration..."

# cdn-config.jsonから許可するオリジンを読み取る
if [ -f "dist/cdn-config.json" ]; then
    ALLOWED_ORIGINS=$(cat dist/cdn-config.json | grep -A 10 "allowedOrigins" | grep "https://" | sed 's/[",]//g' | tr -d ' ' | paste -sd ',' -)
else
    # デフォルト値
    case "$ENVIRONMENT" in
        "staging"|"demo"|"pigeon_demo")
            ALLOWED_ORIGINS="https://*.pigeon-demo.com"
            ;;
        "develop")
            ALLOWED_ORIGINS="https://*.pigeon-dev.com"
            ;;
        "production")
            ALLOWED_ORIGINS="https://*.pigeon-cloud.com"
            ;;
    esac
fi

# CORS設定JSONを作成
cat > /tmp/cors-config.json <<EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["${ALLOWED_ORIGINS}"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3600
        }
    ]
}
EOF

# S3バケットのCORS設定を更新
aws s3api put-bucket-cors \
    --bucket $S3_BUCKET \
    --cors-configuration file:///tmp/cors-config.json \
    --region $AWS_REGION

echo "CORS configuration updated for S3 bucket"

# CloudFront のキャッシュをクリア（オプション）
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "Creating CloudFront invalidation..."
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --region us-east-1
    echo "CloudFront invalidation created"
fi

echo "Deployment completed successfully!"