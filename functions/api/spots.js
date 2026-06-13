// Cloudflare Pages Function: GET /api/spots?code=C01
// ルーティングはファイルパスで決まる（/functions/api/spots.js -> /api/spots）。
// 実ロジックは ../_lib/spots.js に集約。
import { handleGet, handleOptions } from '../_lib/spots.js';

export const onRequestGet = (context) => handleGet(context);
export const onRequestOptions = (context) => handleOptions(context.request);
