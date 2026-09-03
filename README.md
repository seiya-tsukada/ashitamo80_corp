# アシタモハレ コーポレートサイト

`アシタモハレ_サイト全体_縦長.jpg` のデザインを、静的サイト（HTML / CSS / JavaScript）として実装したものです。
ホスティングは Amazon S3 + CloudFront を前提にしています。

- 本番ドメイン: `https://www.ashitamo80.com`（`www` が正規ホスト。理由は「4. S3 + CloudFront + DNS への配置」参照）
- 依存ライブラリ・ビルド工程なし（そのままアップロードすれば動きます）

---

## 1. ディレクトリ構成

```
.
├── index.html          トップページ（1カラム構成・全セクションをページ内リンクで接続）
├── news.html           ニュース一覧
├── privacy.html        プライバシーポリシー
├── 404.html            エラーページ（CloudFront のカスタムエラーレスポンス用）
├── robots.txt
├── sitemap.xml
├── deploy.sh           S3 sync + CloudFront invalidation
├── css/
│   └── style.css       全ページ共通。セクション単位でコメント区切り
├── js/
│   └── main.js         全ページ共通。素の JavaScript のみ
└── img/
    ├── logo.svg            ロゴ（構造化データの logo 用）
    ├── favicon.svg         ファビコン
    ├── apple-touch-icon.png 180×180
    └── ogp.png             OG画像 1200×630
```

**ご相談いただいた構成からの変更点**

| 変更 | 理由 |
| --- | --- |
| 下層ページを `news/index.html` ではなく `news.html` に | S3 + CloudFront では、サブディレクトリの `index.html` 補完が標準では効きません（`DefaultRootObject` はルートのみ有効）。フラットな `.html` にすることで CloudFront Functions を追加せずに動きます。ディレクトリ形式の URL を採用する場合は「6. 補足」を参照してください |
| `404.html` を追加 | 直リンク切れ・タイポ時の受け皿。CloudFront 側で 403/404 をこのファイルに割り当てます |
| `robots.txt` / `sitemap.xml` を追加 | クロール制御と検索エンジンへの URL 通知 |
| `deploy.sh` を追加 | HTML と静的アセットでキャッシュ期間を分けるため |

---

## 2. 実装した機能

**グローバルナビ**
- 画面上部に固定（`position: fixed`）。背景は半透明＋blur、スクロール後に境界線が出ます
- ページ内リンク（`#services` `#process` `#company` `#news` `#careers` `#contact`）は固定ヘッダーの高さを差し引いた位置に着地します
- スクロールスパイ: 現在表示中のセクションのメニューに下線と `aria-current` が付きます
- 900px 以下はハンバーガー＋ドロワー。リンク選択・Esc・リサイズで閉じます
- 下層ページからは `/#services` の形で、トップの該当セクションへ直接戻ります

**その他**
- 実績数値のカウントアップ（初回表示時のみ）、セクションのフェードイン。いずれも `prefers-reduced-motion` に対応
- お問い合わせフォームのクライアント検証（必須・メール形式）、エラー文の表示、送信結果の通知
- 「ページ上部へ戻る」ボタン、フッターの著作権年を自動更新
- キーボード操作: 本文へスキップリンク、フォーカスリング、`aria-expanded` / `aria-controls` の付与

**SEO**
- ページ個別の `title` / `description` / `canonical` / OG / Twitter Card
- 構造化データ: トップに `Organization` `WebSite` `Service`、下層に `BreadcrumbList`（JSON-LD）
- 見出しは各ページ `h1` 1つ、セクションは `h2` 以下で階層化。`section` に `aria-labelledby` を付与
- 電話番号は `tel:` リンク、日付は `<time datetime>` でマークアップ

---

## 3. ローカルでの確認

```bash
cd site
python3 -m http.server 8000
# → http://localhost:8000
```

ルート相対パス（`/css/style.css`）で参照しているため、`index.html` をファイルとして直接開くとスタイルが当たりません。必ずサーバー経由でご確認ください。

---

## 4. S3 + CloudFront + DNS への配置

**S3（バケット: 例 `ashitamo80-web`）**
- パブリックアクセスはすべてブロックしたまま、静的ウェブサイトホスティングも**無効**のままにします
- CloudFront から OAC（Origin Access Control）で参照し、バケットポリシーで当該ディストリビューションのみ許可します

**CloudFront**

| 設定項目 | 値 |
| --- | --- |
| Default root object | `index.html` |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Compress objects automatically | 有効（gzip / Brotli） |
| Cache policy | `CachingOptimized` |
| Custom error response | 403 → `/404.html`（404 を返す）、404 → `/404.html`（404 を返す） |
| Alternate domain name | `www.ashitamo80.com`（apex は登録しません） |
| SSL certificate | ACM（**us-east-1** で発行）。ドメイン名は `www.ashitamo80.com` |

ACM の証明書は DNS 検証を選び、表示される `_xxxx.www.ashitamo80.com` の CNAME を Google Workspace 側の DNS に登録します。CloudFront の代替ドメイン名に登録していないホスト名でアクセスすると `403 (Bad request)` になるため、apex を後から使う場合は証明書と代替ドメイン名の両方を追加してください。

**DNS（Google Workspace 付随の DNS を利用）**

DNS の仕様上、apex（`ashitamo80.com`）に CloudFront を割り当てられません。CloudFront の配信先 IP は固定されないため A レコードでは向けられず、apex に CNAME を置くことも DNS の規格上できません（Route 53 の ALIAS のような独自拡張が必要です）。したがって `www.ashitamo80.com` を正規ホストとし、サイト内の `canonical`・OG の `url`・`sitemap.xml`・構造化データはすべて `https://www.ashitamo80.com/` に統一しています。

| ホスト | 種別 | 値 |
| --- | --- | --- |
| `www` | CNAME | `dxxxxxxxxxxxxx.cloudfront.net`（CloudFront のドメイン名） |
| `_xxxx.www` | CNAME | ACM の DNS 検証用レコード |
| `@`（apex） | — | 「apex の扱い」を参照 |

**apex の扱い**

`ashitamo80.com` を直打ちしたときに何も返らないと機会損失になります。運用中の DNS でできる範囲では、次の順で検討してください。

1. **転送（ウェブアドレス転送 / Domain forwarding）が使える場合** — apex → `https://www.ashitamo80.com` へ 301 転送を設定します。管理画面で完結し、追加費用もかかりません
2. **転送がない場合** — apex 宛の A レコードを、リダイレクト専用の受け口（S3 のリダイレクト用バケット＋CloudFront など）に向ける必要がありますが、結局 apex に CloudFront を向けられない同じ問題に戻ります。この場合は名前解決だけを Route 53 に委任する（Google Workspace のメール用 MX / SPF / DKIM レコードを Route 53 に移設し、レジストラのネームサーバーを Route 53 に変更する）のが最短です。メール周りのレコードを取りこぼすとメールが止まるため、移設する場合は現行レコードを全件書き出してから作業してください
3. **当面は何もしない** — 名刺・資料・広告の表記をすべて `www.ashitamo80.com` に統一する運用でも成立します。ただし apex を入力したユーザーはエラー画面を見ることになるため、1 が可能なら 1 を推奨します

Google Search Console には `https://www.ashitamo80.com/` を URL プレフィックスで登録してください（apex 側は登録不要です）。

**デプロイ**

```bash
BUCKET=ashitamo80-web DIST_ID=E1XXXXXXXXXXXX ./deploy.sh
```

CSS / JS / 画像は 1年キャッシュ、HTML は `max-age=0, must-revalidate` で配信します。CSS・JS を差し替えた際は、ファイル名にバージョンを付ける（`style.css?v=2` ではなく `style.20260903.css` のようにファイル名自体を変える）か、該当パスを invalidate してください。

---

## 5. 公開前に差し替える箇所

1. **モック表記の削除** — ヒーローの `<span class="tag-mock">`、フッター右下の「Design Mock — 架空の企業です」、フォーム下の注意書き、`news.html` / `privacy.html` の末尾注記
2. **お問い合わせフォームの送信先** — 現在は送信していません。`js/main.js` の「8. フォーム検証」内のコメント位置で `fetch()` を呼びます。静的ホスティングでの選択肢は次の3つです
   - API Gateway + Lambda + SES / SNS（AWS 内で完結。reCAPTCHA との併用を推奨）
   - 外部フォームサービス（formrun、HubSpot など）の埋め込みまたは POST 先指定
   - Amazon SES の直接呼び出しは避け、必ずサーバー側で検証を挟む構成にしてください
3. **電話番号・住所・OG画像・会社情報**（すべて架空の値です）
4. **アクセス解析** — GA4 / Google Search Console のタグ挿入位置は `</head>` 直前です

---

## 6. 補足：ディレクトリ形式の URL にする場合

`https://www.ashitamo80.com/news/` の形を採用したい場合は、以下のどちらかが必要です。

- **CloudFront Functions**（Viewer request）で、`/` 終わりの URI に `index.html` を補完する
- S3 の静的ウェブサイトホスティングを有効化し、CloudFront のオリジンをカスタムオリジン（ウェブサイトエンドポイント）にする（この場合 OAC は使えず、バケットが公開になります）

将来ページ数が増える場合は前者を推奨します。その場合 `news.html` → `news/index.html` に移し、各ページの内部リンクとサイトマップの `loc` を合わせて修正してください。
