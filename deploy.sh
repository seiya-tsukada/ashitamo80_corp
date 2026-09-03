#!/usr/bin/env bash
# S3 + CloudFront へのデプロイ
# 使い方: BUCKET=ashitamo80-web DIST_ID=E123ABC456 ./deploy.sh
set -euo pipefail

: "${BUCKET:?BUCKET を指定してください（例: ashitamo80-web）}"
: "${DIST_ID:?DIST_ID を指定してください（CloudFrontのディストリビューションID）}"
SRC="$(cd "$(dirname "$0")" && pwd)"

# 1) ハッシュを持たない静的アセット（更新頻度が低い）: 1年キャッシュ
aws s3 sync "$SRC" "s3://$BUCKET" --delete \
  --exclude "*" --include "css/*" --include "js/*" --include "img/*" \
  --cache-control "public, max-age=31536000, immutable"

# 2) HTML / robots / sitemap: 常に再検証させる
aws s3 sync "$SRC" "s3://$BUCKET" --delete \
  --exclude "css/*" --exclude "js/*" --exclude "img/*" --exclude "deploy.sh" --exclude "README.md" \
  --cache-control "public, max-age=0, must-revalidate"

# 3) キャッシュ削除（HTMLのみ。アセットはファイル名を変えて更新する運用を推奨）
aws cloudfront create-invalidation --distribution-id "$DIST_ID" \
  --paths "/" "/index.html" "/news.html" "/privacy.html" "/404.html" "/sitemap.xml" "/robots.txt"

echo "デプロイが完了しました。"
