// メトロ駅ガチャ — 周辺スポット取得プロキシ (Cloudflare Worker)
//
// 役割:
//   - Foursquare Service API Key を秘匿したまま Places API を呼ぶ
//   - 駅コード(例 C01) -> 座標 を引いて周辺スポットを検索
//   - レスポンスを最小JSONへ正規化し、CORS付きで返す
//   - 駅コード単位で7日キャッシュ（Foursquare呼び出し回数を最小化）
//
// 必要なシークレット: FSQ_SERVICE_KEY  ( `wrangler secret put FSQ_SERVICE_KEY` )
// 使い方: GET /spots?code=C01

import { STATION_GEO } from './stationGeo.js';

// --- Foursquare Places API 設定 -------------------------------------------
const FSQ_ENDPOINT = 'https://places-api.foursquare.com/places/search';
const FSQ_API_VERSION = '2025-06-17'; // X-Places-Api-Version
// 取得するスポットのトップレベルカテゴリ（飲食・観光・名所・ショッピング）。
// ※新FSQタクソノミーのID。導入時に最新ドキュメントで要確認。
//   13000=Dining and Drinking(飲食店・カフェ) / 10000=Arts & Entertainment(観光)
//   16000=Landmarks and Outdoors(名所・公園) / 17000=Retail(ショッピング)
const CATEGORIES = '13000,10000,16000,17000';
const RADIUS_M = 800;
const LIMIT = 8;
const FIELDS = 'fsq_place_id,name,categories,distance,location,latitude,longitude,photos';

const CACHE_TTL = 60 * 60 * 24 * 7; // 7日

// --- CORS ------------------------------------------------------------------
const ALLOWED_ORIGINS = new Set([
  'https://metrandom.com',
  'https://www.metrandom.com',
]);
// ローカル開発は localhost / 127.0.0.1 を任意ポートで許可
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN.test(origin);
  const allow = ok ? origin : 'https://metrandom.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, { status = 200, origin, cache = false } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache ? `public, max-age=${CACHE_TTL}` : 'no-store',
      ...corsHeaders(origin),
    },
  });
}

// --- スポット正規化（新旧スキーマ両対応） ---------------------------------
function normalizePlace(p) {
  const lat = p.latitude ?? p.geocodes?.main?.latitude ?? null;
  const lng = p.longitude ?? p.geocodes?.main?.longitude ?? null;
  const cat = Array.isArray(p.categories) && p.categories.length ? p.categories[0] : null;
  let photo = null;
  if (Array.isArray(p.photos) && p.photos.length) {
    const ph = p.photos[0];
    if (ph?.prefix && ph?.suffix) photo = `${ph.prefix}200x200${ph.suffix}`;
  }
  const loc = p.location || {};
  return {
    id: p.fsq_place_id || p.fsq_id || null,
    name: p.name || '',
    category: cat ? (cat.name || cat.short_name || '') : '',
    distance: typeof p.distance === 'number' ? p.distance : null,
    lat,
    lng,
    address: loc.formatted_address || loc.address || '',
    photo,
  };
}

async function fetchSpots(code, env) {
  const [lat, lng] = STATION_GEO[code];
  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: String(RADIUS_M),
    categories: CATEGORIES,
    limit: String(LIMIT),
    sort: 'DISTANCE',
    fields: FIELDS,
  });
  const res = await fetch(`${FSQ_ENDPOINT}?${params}`, {
    headers: {
      'Authorization': `Bearer ${env.FSQ_SERVICE_KEY}`,
      'X-Places-Api-Version': FSQ_API_VERSION,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Foursquare ${res.status}`);
  }
  const data = await res.json();
  const results = data.results || data.places || [];
  const spots = results.map(normalizePlace).filter(s => s.name && s.lat != null);
  return { raw: data, spots };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    // workers.dev の /spots でも、独自ドメインの /api/spots ルートでも動くよう末尾一致で判定
    if (request.method !== 'GET' || !url.pathname.endsWith('/spots')) {
      return json({ error: 'not_found' }, { status: 404, origin });
    }

    const code = (url.searchParams.get('code') || '').toUpperCase();
    if (!/^[A-Z]\d{2}$/.test(code) || !STATION_GEO[code]) {
      return json({ error: 'invalid_code', spots: [] }, { status: 400, origin });
    }
    if (!env.FSQ_SERVICE_KEY) {
      return json({ error: 'misconfigured', spots: [] }, { status: 500, origin });
    }

    // 駅コード単位でエッジキャッシュ
    const cache = caches.default;
    const cacheKey = new Request(`https://cache.local/spots/${code}`, { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.json();
      return json(body, { origin, cache: true });
    }

    // デバッグ: Foursquare の生レスポンスをそのまま確認する
    //   curl "http://localhost:8787/spots?code=G19&debug=1"
    if (url.searchParams.get('debug')) {
      try {
        const { raw, spots } = await fetchSpots(code, env);
        return json({ code, spotsCount: spots.length, spots, raw }, { origin });
      } catch (e) {
        return json({ error: String(e) }, { status: 502, origin });
      }
    }

    let spots = [];
    try {
      ({ spots } = await fetchSpots(code, env));
    } catch (e) {
      // 失敗時は空配列を返す（フロントは静かに非表示）。キャッシュはしない。
      return json({ code, spots: [], error: 'upstream' }, { status: 502, origin });
    }

    const body = { code, spots };
    ctx.waitUntil(cache.put(cacheKey, json(body, { origin, cache: true }).clone()));
    return json(body, { origin, cache: true });
  },
};
