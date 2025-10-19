#!/usr/bin/env node

/**
 * ビルド後のindex.htmlのアセットURLをCDN URLに書き換えるスクリプト
 * 
 * 使用方法:
 * node scripts/rewrite-cdn-urls.js <environment> [cdn-url]
 * 
 * 環境変数:
 * CDN_URL - CDNのベースURL（例: https://d3470v225vjyu5.cloudfront.net）
 */

const fs = require('fs');
const path = require('path');

// 引数を取得
const args = process.argv.slice(2);
const environment = args[0];
const cdnUrl = args[1] || process.env.CDN_URL;

if (!environment) {
    console.error('Error: Environment is required');
    console.error('Usage: node scripts/rewrite-cdn-urls.js <environment> [cdn-url]');
    process.exit(1);
}

// 環境ごとのCDN URL設定
const cdnUrls = {
    'staging': 'https://d3470v225vjyu5.cloudfront.net',
    'develop': 'https://d2e8w270ud43ok.cloudfront.net',
    'production': '', // 本番環境のCDN URLを設定
    'demo': 'https://d3470v225vjyu5.cloudfront.net',
    'pigeon_demo': 'https://d3470v225vjyu5.cloudfront.net'
};

// CDN URLを決定
const finalCdnUrl = cdnUrl || cdnUrls[environment] || '';

if (!finalCdnUrl) {
    console.log(`No CDN URL configured for environment: ${environment}. Skipping URL rewriting.`);
    process.exit(0);
}

console.log(`Rewriting asset URLs for environment: ${environment}`);
console.log(`CDN URL: ${finalCdnUrl}`);

// index.htmlのパス
const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

// index.htmlが存在するか確認
if (!fs.existsSync(indexPath)) {
    console.error(`Error: index.html not found at ${indexPath}`);
    process.exit(1);
}

// index.htmlを読み込み
let html = fs.readFileSync(indexPath, 'utf8');

// バックアップを作成
fs.writeFileSync(indexPath + '.backup', html);

// 書き換えるパターン
const replacements = [
    // JavaScript files
    {
        pattern: /<script\s+src="(runtime-[^"]+\.js)"/g,
        replacement: `<script src="${finalCdnUrl}/$1"`
    },
    {
        pattern: /<script\s+src="(polyfills-[^"]+\.js)"/g,
        replacement: `<script src="${finalCdnUrl}/$1"`
    },
    {
        pattern: /<script\s+src="(scripts\.[^"]+\.js)"/g,
        replacement: `<script src="${finalCdnUrl}/$1"`
    },
    {
        pattern: /<script\s+src="(vendor-[^"]+\.js)"/g,
        replacement: `<script src="${finalCdnUrl}/$1"`
    },
    {
        pattern: /<script\s+src="(main-[^"]+\.js)"/g,
        replacement: `<script src="${finalCdnUrl}/$1"`
    },
    // CSS files
    {
        pattern: /<link\s+rel="stylesheet"\s+href="(styles\.[^"]+\.css)"/g,
        replacement: `<link rel="stylesheet" href="${finalCdnUrl}/$1"`
    },
    // Assets
    {
        pattern: /href="(assets\/[^"]+)"/g,
        replacement: `href="${finalCdnUrl}/$1"`
    },
    {
        pattern: /src="(assets\/[^"]+)"/g,
        replacement: `src="${finalCdnUrl}/$1"`
    }
];

// 置換を実行
let replacedCount = 0;
replacements.forEach(({ pattern, replacement }) => {
    const matches = html.match(pattern);
    if (matches) {
        replacedCount += matches.length;
        html = html.replace(pattern, replacement);
    }
});

// 書き換えたHTMLを保存
fs.writeFileSync(indexPath, html);

console.log(`Successfully rewrote ${replacedCount} asset URLs in index.html`);

// CORS用のメタデータファイルを作成（S3アップロード時に使用）
const corsConfig = {
    environment: environment,
    cdnUrl: finalCdnUrl,
    allowedOrigins: getOriginsByEnvironment(environment),
    timestamp: new Date().toISOString()
};

fs.writeFileSync(
    path.join(__dirname, '..', 'dist', 'cdn-config.json'),
    JSON.stringify(corsConfig, null, 2)
);

console.log('CDN configuration saved to dist/cdn-config.json');

/**
 * 環境ごとに許可するオリジンを取得
 */
function getOriginsByEnvironment(env) {
    const origins = {
        'staging': [
            'https://*.pigeon-demo.com',
            'https://pigeoncloud-staging-ecs-alb-*.elb.amazonaws.com'
        ],
        'develop': [
            'https://*.pigeon-dev.com',
            'https://pigeoncloud-develop-ecs-alb-*.elb.amazonaws.com'
        ],
        'production': [
            'https://*.pigeon-cloud.com',
            'https://pigeoncloud-prod-ecs-alb-*.elb.amazonaws.com'
        ],
        'demo': [
            'https://*.pigeon-demo.com'
        ],
        'pigeon_demo': [
            'https://*.pigeon-demo.com'
        ]
    };
    
    return origins[env] || [];
}