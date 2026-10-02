# メトロ駅ガチャ

東京メトロの全9路線と都営地下鉄の全4路線、あわせて13路線の中から、ボタンひとつでランダムに1駅を選ぶ Web アプリです。大阪メトロ版（[/osaka/](https://metrandom.com/osaka/)）と名古屋市営地下鉄版（[/nagoya/](https://metrandom.com/nagoya/)）もあります。行き先に迷ったときの途中下車、休日のお散歩コース選び、近場の小旅行、街歩きの目的地決めなどに使えます。

🔗 公開URL: https://metrandom.com/

## 特徴

- ボタンを押すとルーレットのように路線と駅が回転し、最終的に1駅が決まる
- 事業者チップ（東京メトロ／都営地下鉄）でまとめて、路線チップで個別に絞り込み可能
- 出た駅の周辺にあるチェーン以外の飲食店・公園・観光スポットを提案（[OpenPOI API](https://openpoiapi.com/attribution.html)）
- 直近の結果を履歴として表示（履歴の駅をタップすると結果を再表示）
- 各路線は公式ラインカラーと駅ナンバリング（例: G19）付き
- 静的ファイルのみで完結（ビルド不要・依存ライブラリなし）
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

### 大阪メトロ（9路線・134駅）— `/osaka/`

| 記号 | 路線 | ラインカラー |
| --- | --- | --- |
| M | 御堂筋線 | `#E5171F` |
| T | 谷町線 | `#522886` |
| Y | 四つ橋線 | `#0078BA` |
| C | 中央線 | `#019A66` |
| S | 千日前線 | `#E44D93` |
| K | 堺筋線 | `#814721` |
| N | 長堀鶴見緑地線 | `#A9CC51` |
| I | 今里筋線 | `#EE7B1A` |
| P | 南港ポートタウン線 | `#00A0DE` |

### 名古屋市営地下鉄（6路線・100駅）— `/nagoya/`

| 記号 | 路線 | ラインカラー |
| --- | --- | --- |
| H | 東山線 | `#FAB123` |
| M | 名城線 | `#B074D6` |
| E | 名港線 | `#B074D6` |
| T | 鶴舞線 | `#009BBF` |
| S | 桜通線 | `#C92F44` |
| K | 上飯田線 | `#EC78B4` |

都市版は東京版とは別の抽選プール・履歴を持ちます。上部の「東京 / 大阪 / 名古屋」で切り替えられます。

## 使い方

1. [公開ページ](https://metrandom.com/) を開く
2. （任意）上部の事業者チップ・路線チップをタップして対象を絞り込む
3. 「ガチャを回す」ボタンを押す
4. 表示された駅を確認する（直近の結果は履歴に残ります）

## ローカルで動かす

ビルド不要です。`/app.js` などをルート相対パスで読み込むため、任意の静的サーバーで開いてください。

```bash
git clone https://github.com/Suyama-Daichi/metro-random.git
cd metro-random
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

## ファイル構成

```
.
├── index.html              # アプリ本体（日本語）
├── en/ , zh/               # 各言語版（同構成）
├── osaka/ , nagoya/        # 都市版トップ（en/osaka/ 等も。東京版から自動生成）
├── app.js / app.css        # 全都市・3言語共通のスクリプト・スタイル
├── data/{tokyo,osaka,nagoya}.js # 都市ごとの路線・駅・ガイドデータ（app.js より先に読み込む）
├── station.css             # 駅別シェアページ共通のスタイル
├── s/ , en/s/ , zh/s/      # 駅別シェアページ（東京291駅 × 3言語。都市版は osaka/s/ 等）
├── og/                     # 駅別OGP画像（都市版は og/osaka/ , og/nagoya/）
├── scripts/
│   ├── generate-station-pages.mjs # 駅別シェアページ・都市版トップの再生成
│   └── generate-og-images.mjs     # 大阪・名古屋のOGP画像生成（ヘッドレスChrome）
├── favicon.svg / favicon.png / apple-touch-icon.png / og-image.png
├── robots.txt / sitemap.xml
└── README.md
```

### 結果の共有URL

- 東京メトロ・都営地下鉄いずれの駅も、静的な結果ページ `/s/{駅コード}/`（例 `/s/G19/`、
  `/s/E23/`）を共有します。OGP画像は `og/{駅コード}.jpg`。
- 大阪・名古屋版は `/osaka/s/M11/`、`/nagoya/s/H08/` のように都市パスが付きます。

## 技術構成

- HTML / CSS / Vanilla JavaScript のみ（フレームワーク・ビルドツールなし）
- 駅データは `data/{都市}.js`（東京・大阪・名古屋）
- ホスティング: Cloudflare Pages（GitHub 連携で自動デプロイ）
- SEO 対応: メタ情報・OGP・Twitter カード・JSON-LD（`WebApplication`）・robots.txt・sitemap.xml

## 備考

駅名・路線データは制作時点の情報に基づきます。実際の運行情報は[東京メトロ公式サイト](https://www.tokyometro.jp/)、[東京都交通局公式サイト](https://www.kotsu.metro.tokyo.jp/)、[Osaka Metro公式サイト](https://subway.osakametro.co.jp/)、[名古屋市交通局公式サイト](https://www.kotsu.city.nagoya.jp/)をご確認ください。本アプリは非公式の個人制作物です。
