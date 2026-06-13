# metrandom-spots (Cloudflare Worker)

「メトロ駅ガチャ」の **周辺スポット取得プロキシ**。Foursquare Places API の
Service API Key を秘匿したまま、駅コードから周辺スポットを返します。

```
GET /spots?code=C01
-> { "code": "C01", "spots": [ { name, category, distance, lat, lng, address, photo, id }, ... ] }
```

GitHub Pages（静的サイト本体）とは独立してデプロイします。サイトのフロントは
この Worker の URL を `index.html` 内の定数 `SPOTS_API` で参照します。

## セットアップ

前提: Node.js と [wrangler](https://developers.cloudflare.com/workers/wrangler/) 。

```bash
cd worker
npm i -g wrangler          # もしくは npx wrangler を利用

# Foursquare の Service API Key を登録（リポジトリには絶対に置かない）
wrangler secret put FSQ_SERVICE_KEY

# ローカル動作確認
wrangler dev
#   別ターミナルで:
#   curl "http://localhost:8787/spots?code=G19"

# デプロイ
wrangler deploy
```

デプロイ後に表示される URL（例 `https://metrandom-spots.<subdomain>.workers.dev`）を
フロントの `SPOTS_API` に設定してください。独自ドメインを Cloudflare 管理にしている
場合は `wrangler.toml` の `routes` を使い `metrandom.com/api/spots` に割り当てると
**同一オリジン（CORS不要）**にできます。

## 仕組み・運用メモ

- **キャッシュ**: 駅コード単位で 7 日間エッジキャッシュ。スポットは滅多に変わらない
  ため、アクセスが増えても Foursquare 呼び出しは「ユニーク駅数 / 週」程度に収まり、
  無料枠 / クレジット内で運用できます。
- **設定値**（`src/index.js` 冒頭）: `RADIUS_M=800`、`LIMIT=8`、`CATEGORIES`
  （飲食 13000 / 観光 10000 / 名所 16000 / ショッピング 17000）。Foursquare の
  新タクソノミーの ID・レスポンスのフィールド名は導入時に最新ドキュメントで
  確認してください（`normalizePlace` は新旧スキーマの両方に耐えるよう実装済み）。
- **CORS**: `ALLOWED_ORIGINS` に `metrandom.com` 等を許可。ローカル確認用に
  `localhost:8080` も許可しています。

## 座標データ出典

`src/stationGeo.js`（全185駅の座標）は
[Seo-4d696b75/station_database](https://github.com/Seo-4d696b75/station_database)
を出典として生成しています（ekidata.jp 等に由来する公開データ）。利用規約に従い
出典を明記しています。
