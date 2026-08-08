# メトロ駅ガチャ

東京メトロの全9路線と都営地下鉄の全4路線、あわせて13路線の中から、ボタンひとつでランダムに1駅を選ぶ Web アプリです。行き先に迷ったときの途中下車、休日のお散歩コース選び、近場の小旅行、街歩きの目的地決めなどに使えます。

同じサイト内に**大阪メトロ版**（大阪メトロ全9路線・134駅）も用意しています。詳細は
[大阪メトロ駅ガチャ](#大阪メトロ駅ガチャ)を参照してください。

🔗 公開URL: https://metrandom.com/ （大阪版: https://metrandom.com/osaka/）

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

## 大阪メトロ駅ガチャ

同じリポジトリ・同じドメイン内の新セクションとして、大阪メトロ版を
`/osaka/`, `/en/osaka/`, `/zh/osaka/` に用意しています。東京版とは別の
LINES/GUIDES データを持つ独立したミニアプリで、東京メトロ・都営とは
路線記号が被らないよう内部IDに2文字接頭辞（`OM`, `OT` 等）を使っています
（画面表示上の路線記号は実際の大阪メトロの記号 `M`, `T` 等のまま）。

### 対応路線（大阪メトロ全9路線・134駅）

| 記号 | 路線 | ラインカラー | 駅番号範囲 |
| --- | --- | --- | --- |
| M | 御堂筋線 | `#E5171F` | M11〜M30 |
| T | 谷町線 | `#522886` | T11〜T36 |
| Y | 四つ橋線 | `#0078BA` | Y11〜Y21 |
| C | 中央線 | `#019A66` | C09〜C23 |
| S | 千日前線 | `#E44D93` | S11〜S24 |
| K | 堺筋線 | `#814721` | K11〜K20 |
| N | 長堀鶴見緑地線 | `#A9CC51` | N11〜N27 |
| I | 今里筋線 | `#EE7B1A` | I11〜I21 |
| P | 南港ポートタウン線（ニュートラム） | `#00A0DE` | P09〜P18 |

路線ごとに駅番号の開始が異なる（例: 御堂筋線はM11から、中央線は夢洲延伸により
C09から）ため、大阪版のみ `num2()` を路線の `numStart` を考慮する形に拡張しています
（東京版の `num2()` は無変更）。

駅データの出典は東京版と同じ [Seo-4d696b75/station_database](https://github.com/Seo-4d696b75/station_database)。
ローマ字駅名は同データベースに収録が無いため、ヘボン式ローマ字表記を個別に確認して
追加しました。

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
├── index.html              # 東京版アプリ本体（HTML / CSS / JS を1ファイルに同梱）
├── en/ , zh/               # 東京版の各言語版（同構成）
├── s/ , en/s/ , zh/s/      # 東京版・駅別シェアページ（全291駅 × 3言語）
├── osaka/                  # 大阪版アプリ本体（index.html, manifest.webmanifest）
├── en/osaka/ , zh/osaka/   # 大阪版の各言語版（同構成）
├── osaka/s/ , en/osaka/s/ , zh/osaka/s/  # 大阪版・駅別シェアページ（全134駅 × 3言語）
├── og/                     # 駅別OGP画像（東京: og/{code}.jpg、大阪: og/osaka/{code}.jpg）
├── functions/              # Cloudflare Pages Functions
│   ├── api/spots.js        #   GET /api/spots?code=C01（周辺スポットAPI・東京/大阪共通）
│   └── _lib/
│       ├── spots.js        #   Foursquare 呼び出し・正規化・キャッシュ
│       └── stationGeo.js   #   全425駅（東京291+大阪134）の座標テーブル（自動生成）
├── scripts/
│   ├── generate-station-geo.mjs   # 座標テーブル再生成スクリプト（東京・大阪両対応）
│   └── generate-station-pages.mjs # 駅別シェアページ再生成スクリプト（東京・大阪両対応）
├── .dev.vars.example       # ローカル開発用の環境変数テンプレート
├── favicon.svg / favicon.png / apple-touch-icon.png
├── og-image.png / og-image-osaka.png  # トップページ用OGP画像
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
- `functions/_lib/stationGeo.js` … 全425駅（東京291+大阪134）の座標テーブル
  （駅コード→緯度経度）。出典: [Seo-4d696b75/station_database](https://github.com/Seo-4d696b75/station_database)。
  `node scripts/generate-station-geo.mjs` で再生成可能（`index.html` と
  `osaka/index.html` 両方の LINES を読み込む）。
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

## OGP画像の生成手順

駅別シェアページの OGP 画像（`og/{code}.jpg`, `og/osaka/{code}.jpg`、1200×630）は
リポジトリにコミット済みの静的アセットで、**生成スクリプトはコミットしていません**
（「ビルド不要・依存ライブラリなし」の方針を保つため）。駅を追加・変更した場合や
デザインを更新したい場合は、以下の手順で手動生成してください（ヘッドレスブラウザが
使えるツール実行環境が必要）。

1. 装飾背景（右側のサブウェイマップ風の線・ドット）は既存の `og/G01.jpg` 等から
   流用する。1200×630のJPEGをそのままCSSの `background-image` として使い、
   駅名・路線バッジ部分だけを同系色のグラデーション矩形で覆って再描画する
   （右端は `mask-image` のグラデーションでフェードさせ、境目を目立たなくする）。
2. 駅名フォントは "M PLUS Rounded 1c"（weight 800）。Google Fonts の
   `css2?family=M+PLUS+Rounded+1c:wght@800&text=<必要な文字だけ>` で必要な文字に
   絞ったサブセット woff2 を取得し、`<style>` に base64 埋め込みする
   （実行環境によっては Google Fonts への通常のブラウザ経由フェッチがプロキシ越しに
   失敗することがあるため、事前ダウンロード＋埋め込みで完結させるのが安全）。
3. Chromium を直接ヘッドレス起動してスクリーンショットを撮る:
   ```bash
   chromium --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
     --force-device-scale-factor=1 --window-size=1200,700 \
     --screenshot=out.png file:///path/to/template.html
   # 1200x700 で撮って (0,0)-(1200,630) にクロップすると安定する
   ```
4. Pillow等で 1200×630 にクロップし、JPEG品質88程度で保存する。

大阪版は「メトロ駅ガチャ」ヘッダー文言だけ「大阪メトロ駅ガチャ」に差し替える必要が
あったため、装飾背景からアイコングラフィックだけを別途切り出して重ね直している。
トップページ用の `og-image.png` / `og-image-osaka.png`（駅別ではない、サイト全体の
OGP画像）も同様の手法で作成。

## 技術構成

- HTML / CSS / Vanilla JavaScript のみ（フレームワーク・ビルドツールなし）
- 駅データは各アプリの `index.html` 内に内蔵（東京版・大阪版はそれぞれ独立した
  LINES/GUIDES/LINE_I18N を持つ別アプリ。ガチャの抽選プールが混ざらないよう
  意図的に分離している）
- 周辺スポットは Foursquare Places API（Cloudflare Pages Functions 経由、
  東京版・大阪版共通の `/api/spots` エンドポイント）
- ホスティング: Cloudflare Pages（GitHub 連携で自動デプロイ）
- SEO 対応: メタ情報・OGP・Twitter カード・JSON-LD（`WebApplication` / 駅別ページは
  `WebPage`+`BreadcrumbList`+`TrainStation`）・robots.txt・sitemap.xml

## 備考

駅名・路線データは制作時点の情報に基づきます。実際の運行情報は
[東京メトロ公式サイト](https://www.tokyometro.jp/)、
[東京都交通局公式サイト](https://www.kotsu.metro.tokyo.jp/)、
[Osaka Metro公式サイト](https://www.osakametro.co.jp/)をご確認ください。
本アプリは非公式の個人制作物です。
