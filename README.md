# メトロ駅ガチャ

東京メトロの全9路線と都営地下鉄の全4路線、あわせて13路線の中から、ボタンひとつでランダムに1駅を選ぶ Web アプリです。行き先に迷ったときの途中下車、休日のお散歩コース選び、近場の小旅行、街歩きの目的地決めなどに使えます。

🔗 公開URL: https://metrandom.com/

## 特徴

- ボタンを押すとルーレットのように路線と駅が回転し、最終的に1駅が決まる
- 事業者チップ（東京メトロ／都営地下鉄）でまとめて、路線チップで個別に絞り込み可能
- 直近の結果を履歴として表示（履歴の駅をタップすると結果を再表示）
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

このサイトは **Cloudflare Pages** でホスティングしています（静的サイトのみ）。

- リポジトリ: GitHub 連携（`main` への push で自動デプロイ）
- ビルド: なし（ビルドコマンド空・出力ディレクトリはルート `/`）
- 公開URL: https://metrandom.com/

### Cloudflare Pages のセットアップ

1. Cloudflare ダッシュボード → **Workers & Pages → Create → Pages → Connect to Git**
   でこのリポジトリを接続。
2. ビルド設定:
   - **Framework preset**: None
   - **Build command**: （空）
   - **Build output directory**: `/`
3. **Custom domains** で `metrandom.com`（と必要なら `www`）を追加。apex ドメインを
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
├── scripts/
│   └── generate-toei-station-pages.mjs # 都営地下鉄駅の共有ページ再生成スクリプト
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

## 技術構成

- HTML / CSS / Vanilla JavaScript のみ（フレームワーク・ビルドツールなし）
- 駅データは `index.html` 内に内蔵
- ホスティング: Cloudflare Pages（GitHub 連携で自動デプロイ）
- SEO 対応: メタ情報・OGP・Twitter カード・JSON-LD（`WebApplication`）・robots.txt・sitemap.xml

## 備考

駅名・路線データは制作時点の情報に基づきます。実際の運行情報は[東京メトロ公式サイト](https://www.tokyometro.jp/)および[東京都交通局公式サイト](https://www.kotsu.metro.tokyo.jp/)をご確認ください。本アプリは非公式の個人制作物です。
