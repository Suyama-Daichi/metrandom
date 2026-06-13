// メトロ駅ガチャ — 周辺スポット取得のコアロジック（Foursquare Places API）。
// Cloudflare Pages Functions（functions/api/spots.js）から呼ばれる。
//
// 役割:
//   - Foursquare Service API Key を秘匿したまま Places API を呼ぶ
//   - 駅コード(例 C01) -> 座標 を引いて周辺スポットを検索
//   - レスポンスを最小JSONへ正規化して返す
//   - 駅コード単位で7日キャッシュ（Foursquare呼び出し回数を最小化）
//
// 必要な環境変数: FSQ_SERVICE_KEY
//   - ローカル(`wrangler pages dev`): プロジェクト直下の .dev.vars
//   - 本番: Cloudflare Pages プロジェクトの環境変数（暗号化）に設定

import { STATION_GEO } from './stationGeo.js';

// --- Foursquare Places API 設定 -------------------------------------------
const FSQ_ENDPOINT = 'https://places-api.foursquare.com/places/search';
const FSQ_API_VERSION = '2025-06-17'; // X-Places-Api-Version
// 取得するスポットのトップレベルカテゴリ（飲食・観光・名所・ショッピング）。
//   13000=Dining and Drinking(飲食店・カフェ) / 10000=Arts & Entertainment(観光)
//   16000=Landmarks and Outdoors(名所・公園) / 17000=Retail(ショッピング)
const CATEGORIES = '13000,10000,16000,17000';
const RADIUS_M = 800;
const LIMIT = 8;
const FIELDS = 'fsq_place_id,name,categories,distance,location,latitude,longitude,photos,tips';

// 言語コード -> Foursquare ロケール（Accept-Language）。
// Foursquare 対応ロケール: en, es, fr, de, it, ja, th, tr, ko, ru, pt, id
// （zh は非対応のため en にフォールバック）
const LOCALES = { ja: 'ja', en: 'en', zh: 'en' };
const DEFAULT_LOCALE = 'ja';

const CACHE_TTL = 60 * 60 * 24 * 7; // 7日

// --- CORS（Pages では同一オリジンのため基本不要だが、保険として付与）---------
const ALLOWED_ORIGINS = new Set([
  'https://metrandom.com',
  'https://www.metrandom.com',
]);
// ローカル開発は localhost / 127.x / 0.0.0.0 / IPv6ループバック([::],[::1]) を任意ポートで許可
const LOCAL_ORIGIN = /^http:\/\/(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1?\])(?::\d+)?$/;

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
  // Tips（ユーザーの口コミ）。premium フィールド。先頭の1件のテキストのみ採用。
  let tip = '';
  if (Array.isArray(p.tips) && p.tips.length) {
    const text = p.tips[0]?.text;
    if (typeof text === 'string') tip = text.trim();
  }
  return {
    id: p.fsq_place_id || p.fsq_id || null,
    name: p.name || '',
    category: cat ? (cat.name || cat.short_name || '') : '',
    distance: typeof p.distance === 'number' ? p.distance : null,
    lat,
    lng,
    address: loc.formatted_address || loc.address || '',
    photo,
    tip,
  };
}

async function fetchSpots(code, env, locale) {
  const [lat, lng] = STATION_GEO[code];
  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: String(RADIUS_M),
    categories: CATEGORIES,
    limit: String(LIMIT),
    sort: 'DISTANCE',
    fields: FIELDS,
    exclude_all_chains: 'true', // コンビニ・大手チェーン店を除外（個人店等のみ）
  });
  const res = await fetch(`${FSQ_ENDPOINT}?${params}`, {
    headers: {
      'Authorization': `Bearer ${env.FSQ_SERVICE_KEY}`,
      'X-Places-Api-Version': FSQ_API_VERSION,
      'Accept': 'application/json',
      'Accept-Language': locale, // カテゴリ名等のローカライズ
    },
  });
  if (!res.ok) {
    throw new Error(`Foursquare ${res.status}`);
  }
  const data = await res.json();
  const results = data.results || data.places || [];
  return results.map(normalizePlace).filter(s => s.name && s.lat != null);
}

// --- Pages Functions ハンドラ ---------------------------------------------
export function handleOptions(request) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function handleGet(context) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';

  const code = (url.searchParams.get('code') || '').toUpperCase();
  if (!/^[A-Z]\d{2}$/.test(code) || !STATION_GEO[code]) {
    return json({ error: 'invalid_code', spots: [] }, { status: 400, origin });
  }
  if (!env.FSQ_SERVICE_KEY) {
    return json({ error: 'misconfigured', spots: [] }, { status: 500, origin });
  }

  const lang = (url.searchParams.get('lang') || '').toLowerCase();
  const locale = LOCALES[lang] || DEFAULT_LOCALE;

  // 駅コード×ロケール単位でエッジキャッシュ
  const cache = caches.default;
  const cacheKey = new Request(`https://cache.local/spots/${code}/${locale}`, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const body = await cached.json();
    return json(body, { origin, cache: true });
  }

  let spots = [];
  try {
    spots = await fetchSpots(code, env, locale);
  } catch (e) {
    // 失敗時は空配列を返す（フロントは静かに非表示）。キャッシュはしない。
    return json({ code, spots: [], error: 'upstream' }, { status: 502, origin });
  }

  const body = { code, spots };
  waitUntil(cache.put(cacheKey, json(body, { origin, cache: true }).clone()));
  return json(body, { origin, cache: true });
}
