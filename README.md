# メトロ駅ガチャ

東京メトロの全9路線・約180駅の中から、ボタンひとつでランダムに1駅を選ぶ Web アプリです。行き先に迷ったときの途中下車、休日のお散歩コース選び、近場の小旅行、街歩きの目的地決めなどに使えます。

🔗 公開URL: https://metrandom.com/

## 特徴

- ボタンを押すとルーレットのように路線と駅が回転し、最終的に1駅が決まる
- 路線チップのタップで対象路線をオン・オフして絞り込み可能
- 直近の結果を履歴として表示
- 各路線は公式ラインカラーと駅ナンバリング（例: G19）付き
- 単一の `index.html` で完結（ビルド不要・依存ライブラリなし）
- レスポンシブ対応でスマホでも利用可能
- 多言語対応（日本語・英語・中国語簡体字）。ブラウザ言語を自動判定し、手動切替も可能

## 対応路線

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

## 使い方

1. [公開ページ](https://metrandom.com/) を開く
2. （任意）上部の路線チップをタップして対象路線を絞り込む
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

このサイトは **GitHub Pages** でホスティングしています。

- 公開元: `main` ブランチのルート（`/`）
- 公開URL: https://metrandom.com/
- エントリーポイント: `index.html`（GitHub Pages が自動配信）

### デプロイ方法

`main` ブランチへ push すると、GitHub Pages が自動的にビルド・公開します。専用のビルド工程はありません。

```bash
git add .
git commit -m "Update"
git push origin main
```

### GitHub Pages の設定

リポジトリの **Settings → Pages** で以下のように設定しています。

- **Source**: Deploy from a branch
- **Branch**: `main` / `（root）`

### カスタムドメイン（設定中）

リポジトリには独自ドメイン用の `CNAME` ファイル（`metrandom.com`）が含まれています。apex ドメインを GitHub Pages に向けるには、DNS プロバイダ側で次の A レコードが必要です（設定が完了するまでは GitHub Pages の既定URLで公開されます）。

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

詳細は [GitHub 公式ドキュメント](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) を参照してください。

## ファイル構成

```
.
├── index.html          # アプリ本体（HTML / CSS / JS を1ファイルに同梱）
├── favicon.svg         # ファビコン（SVG）
├── favicon.png         # ファビコン（PNG フォールバック）
├── apple-touch-icon.png# iOS ホーム画面用アイコン
├── og-image.png        # OGP / SNS シェア用画像
├── robots.txt          # クローラ向け設定
├── sitemap.xml         # サイトマップ
├── CNAME               # カスタムドメイン設定
└── README.md
```

## 技術構成

- HTML / CSS / Vanilla JavaScript のみ（フレームワーク・ビルドツールなし）
- 駅データは `index.html` 内に内蔵
- SEO 対応: メタ情報・OGP・Twitter カード・JSON-LD（`WebApplication`）・robots.txt・sitemap.xml

## 備考

駅名・路線データは制作時点の情報に基づきます。実際の運行情報は[東京メトロ公式サイト](https://www.tokyometro.jp/)をご確認ください。本アプリは非公式の個人制作物です。
