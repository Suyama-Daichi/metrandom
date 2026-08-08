# メトロ駅ガチャ

東京メトロの全9路線と都営地下鉄の全4路線、あわせて13路線の中から、ボタンひとつでランダムに1駅を選ぶ Web アプリです。行き先に迷ったときの途中下車、休日のお散歩コース選び、近場の小旅行、街歩きの目的地決めなどに使えます。

🔗 公開URL: https://metrandom.com/

## 特徴

- ボタンを押すとルーレットのように路線と駅が回転し、最終的に1駅が決まる
- 事業者チップ（東京メトロ／都営地下鉄）でまとめて、路線チップで個別に絞り込み可能
- 直近の結果を履歴として表示（履歴の駅をタップすると結果を再表示）
- 選ばれた駅の**周辺スポット**（飲食店・カフェ・観光名所・ショッピング）を表示（Foursquare）
- 各路線は公式ラインカラーと駅ナンバリング（例: G19）付き
- 単一の `index.html` で完結（ビルド不要・依存ライブラリなし）
- レスポンシブ対応でスマホでも利用可能
- 多言語対応（日本語・英語・中国語簡体字）。ブラウザ言語を自動判定し、手動切替も可能

## 対応路線

### 東京メトロ（9路線・185駅）

| 記号 | 路線 | ラインカラー |
| --- | --- | --- |
| G | 銀座線 | `#FF9500` |
| M | 丸ノ内線 | `#F62E36` |
| H | 日比谷線 | `#B5B5AC` |
| T | 東西線 | `#009BBF` |
| C | 千代田線 | `#00BB85` |
| Y | 有楽町線 | `#C1A470` |
| Z | 半蔵門線 | `#8F76D6` |
| N | 南北線 | `#00AC9B` |
| F | 副都心線 | `#9C5E31` |

### 都営地下鉄（4路線・106駅）

| 記号 | 路線 | ラインカラー |
| --- | --- | --- |
| A | 都営浅草線 | `#E85298` |
| I | 都営三田線 | `#0079C2` |
| S | 都営新宿線 | `#6CBB5A` |
| E | 都営大江戸線 | `#B6007A` |

駅数は各路線の駅の合計（乗換駅は路線ごとに数える）で、ガチャの抽選プールは全291駅です。

## 使い方

1. [公開ページ](https://metrandom.com/) を開く
2. （任意）上部の事業者チップ・路線チップをタップして対象を絞り込む
3. 「ガチャを回す」ボタンを押す
4. 表示された駅を確認する（直近の結果は履歴に残ります）

## ローカルで動かす

ビルド不要です。リポジトリを取得してブラウザで `index.html` を開くだけで動作します。

```bash
git clone https://github.com/Suyama-Daichi/metro-random.git
cd metro-random
open index.html   # macOS の場合（Windows は start、Linux は xdg-open）
```

ローカルサーバーで確認したい場合は、任意の静的サーバーを利用してください。

```bash
python3 -m http.server 8000
# http://localhost:8000 を開く
```

## ホスティング

このサイトは **Cloudflare Pages** でホスティングしています（静的サイト＋周辺スポット
APIの Pages Functions を同一プロジェクトで配信）。

- リポジトリ: GitHub 連携（`main` への push で自動デプロイ）
- ビルド: なし（ビルドコマンド空・出力ディレクトリはルート `/`）
- 公開URL: https://metrandom.com/
- API: `functions/api/spots.js`（同一オリジン `/api/spots`）

### Cloudflare Pages のセットアップ

1. Cloudflare ダッシュボード → **Workers & Pages → Create → Pages → Connect to Git**
   でこのリポジトリを接続。
2. ビルド設定:
   - **Framework preset**: None
   - **Build command**: （空）
   - **Build output directory**: `/`
3. **環境変数** に `FSQ_SERVICE_KEY`（Foursquare の Service API Key）を登録（暗号化）。
   周辺スポット機能に必要です。
4. **Custom domains** で `metrandom.com`（と必要なら `www`）を追加。apex ドメインを
   使うには、ドメインの DNS を Cloudflare 管理にするのが前提です（ネームサーバを
   Cloudflare に向ける）。Pages が DNS レコードを自動設定します。

> `main` への push で自動的に再デプロイされます。プルリクのプレビューデプロイも利用可。

### GitHub Pages からの移行メモ

- 旧 `CNAME` ファイルは GitHub Pages 用で、Cloudflare Pages では未使用です（カスタム
  ドメインはダッシュボードで設定）。残してあっても無害なので当面そのままにしています。
- 移行が完了するまでは、DNS の切り替えタイミングで一時的に旧 GitHub Pages 側が
  見えることがあります。

## ファイル構成

```
.
├── index.html              # アプリ本体（HTML / CSS / JS を1ファイルに同梱）
├── en/ , zh/               # 各言語版（同構成）
├── s/ , en/s/ , zh/s/      # 駅別シェアページ（全291駅 × 3言語）
├── functions/              # Cloudflare Pages Functions
│   ├── api/spots.js        #   GET /api/spots?code=C01（周辺スポットAPI）
│   └── _lib/
│       ├── spots.js        #   Foursquare 呼び出し・正規化・キャッシュ
│       └── stationGeo.js   #   全291駅の座標テーブル（自動生成）
├── scripts/
│   ├── generate-station-geo.mjs        # 座標テーブル再生成スクリプト
│   └── generate-toei-station-pages.mjs # 都営地下鉄駅の共有ページ再生成スクリプト
├── .dev.vars.example       # ローカル開発用の環境変数テンプレート
├── favicon.svg / favicon.png / apple-touch-icon.png / og-image.png
├── robots.txt / sitemap.xml
├── CNAME                   # （旧 GitHub Pages 用・Cloudflare では未使用）
└── README.md
```

### 結果の共有URL

- 東京メトロ・都営地下鉄いずれの駅も、静的な結果ページ `/s/{駅コード}/`（例 `/s/G19/`、
  `/s/E23/`）を共有します。OGP画像は `og/{駅コード}.jpg`。
- 旧形式の `?s={駅コード}`（例 `/?s=E23`）付きURLも後方互換のため引き続き復元表示に対応
  しています（`restoreFromQuery()`）。

## 周辺スポット機能（Foursquare）

選ばれた駅の周辺スポットは Foursquare Places API から取得します。API キーを秘匿する
ため、**Cloudflare Pages Functions**（`functions/api/spots.js`）をプロキシとして使い、
ブラウザからは同一オリジンの `/api/spots` を呼びます。

- `functions/api/spots.js` … ルート（`GET /api/spots?code=G19` → 周辺スポットJSON）
- `functions/_lib/spots.js` … Foursquare 呼び出し・正規化・7日キャッシュ・CORS
- `functions/_lib/stationGeo.js` … 全291駅の座標テーブル（駅コード→緯度経度）。
  出典: [Seo-4d696b75/station_database](https://github.com/Seo-4d696b75/station_database)。
  `node scripts/generate-station-geo.mjs` で再生成可能。
- フロント側は `index.html` の定数 `SPOTS_API`（既定 `/api/spots`）で参照します。
  API 未設定（`FSQ_SERVICE_KEY` 無し）や取得失敗時はスポット欄が出ないだけで、
  ガチャ本体は通常どおり動作します。

### ローカルで動かす（Functions込み）

```bash
cp .dev.vars.example .dev.vars   # FSQ_SERVICE_KEY=... を記入
npx wrangler pages dev .
# 表示された URL（例 http://localhost:8788）を開く
#   API 単体確認: curl "http://localhost:8788/api/spots?code=G19"
```

静的サイト部分だけ確認するなら、従来どおり任意の静的サーバー（`python3 -m http.server`
など）でも動きます（その場合 `/api/spots` は応答しないためスポット欄は非表示）。

## 技術構成

- HTML / CSS / Vanilla JavaScript のみ（フレームワーク・ビルドツールなし）
- 駅データは `index.html` 内に内蔵
- 周辺スポットは Foursquare Places API（Cloudflare Pages Functions 経由）
- ホスティング: Cloudflare Pages（GitHub 連携で自動デプロイ）
- SEO 対応: メタ情報・OGP・Twitter カード・JSON-LD（`WebApplication`）・robots.txt・sitemap.xml

## 備考

駅名・路線データは制作時点の情報に基づきます。実際の運行情報は[東京メトロ公式サイト](https://www.tokyometro.jp/)および[東京都交通局公式サイト](https://www.kotsu.metro.tokyo.jp/)をご確認ください。本アプリは非公式の個人制作物です。
