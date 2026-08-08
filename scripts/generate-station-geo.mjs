// functions/_lib/stationGeo.js を再生成するスクリプト。
//
// データ出典: Seo-4d696b75/station_database
//   https://github.com/Seo-4d696b75/station_database  (out/main/line/{code}.json)
// サイト本体 (../index.html, ../osaka/index.html) の LINES と、路線ごとに
//   駅名でマッチングして駅コード (G01, OM11 等) -> [lat, lng] を生成する。
//
// 実行: node scripts/generate-station-geo.mjs
//
// 注意: station_database は路線の並び順がサイトと逆のことがある（例: 南北線）。
//   そのためインデックスではなく「駅名」でマッチングしている。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// サイトの key(=内部ID) -> station_database の路線ファイルコード
const LINE_FILE = {
  // 東京メトロ
  G: 28001, M: 28002, H: 28003, T: 28004, C: 28005,
  Y: 28006, Z: 28008, N: 28009, F: 28010,
  // 都営地下鉄
  A: 99302, I: 99303, S: 99304, E: 99301,
  // 大阪メトロ
  OM: 99618, OT: 99619, OY: 99620, OC: 99621, OS: 99622,
  OK: 99623, ON: 99624, OI: 99652, OP: 99625,
};
const BASE = 'https://raw.githubusercontent.com/Seo-4d696b75/station_database/main/out/main/line';

// 駅名の正規化（カッコ書きの曖昧性回避を除去し、ケ/ヶ を統一）
const norm = s => s.replace(/[（(〈【].*?[)）〉】]/g, '').replace(/ケ/g, 'ヶ').trim();

function extractLinesFrom(html) {
  const m = html.match(/const LINES = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('LINES not found');
  return (0, eval)(m[1]);
}

const tokyoHtml = await readFile(join(ROOT, 'index.html'), 'utf8');
const osakaHtml = await readFile(join(ROOT, 'osaka', 'index.html'), 'utf8');
const LINES = [...extractLinesFrom(tokyoHtml), ...extractLinesFrom(osakaHtml)];

const geo = {};
const warnings = [];
for (const line of LINES) {
  const code = LINE_FILE[line.key];
  if (!code) throw new Error(`LINE_FILE has no entry for key "${line.key}"`);
  const res = await fetch(`${BASE}/${code}.json`);
  if (!res.ok) throw new Error(`fetch ${code} failed: ${res.status}`);
  const { station_list } = await res.json();
  const byName = new Map(station_list.map(st => [norm(st.name), [+st.lat.toFixed(6), +st.lng.toFixed(6)]]));
  const numStart = line.numStart || 1;
  line.stations.forEach((st, i) => {
    const c = line.key + String(i + numStart).padStart(2, '0');
    const hit = byName.get(norm(st[0]));
    if (!hit) { warnings.push(`NO MATCH ${c} "${st[0]}"`); return; }
    geo[c] = hit;
  });
}

if (warnings.length) {
  console.error('警告:'); warnings.forEach(w => console.error('  ' + w));
  throw new Error(`${warnings.length} 駅が未マッチ。確認してください。`);
}

const order = Object.keys(LINE_FILE);
const codes = Object.keys(geo).sort((a, b) => {
  const keyA = order.find(k => a.startsWith(k) && /^\d+$/.test(a.slice(k.length)));
  const keyB = order.find(k => b.startsWith(k) && /^\d+$/.test(b.slice(k.length)));
  return order.indexOf(keyA) - order.indexOf(keyB) || (+a.slice(keyA.length)) - (+b.slice(keyB.length));
});

let out = `// 東京メトロ・都営地下鉄・大阪メトロ 全${codes.length}駅の座標テーブル（駅コード -> [緯度, 経度]）
// データ出典: Seo-4d696b75/station_database (https://github.com/Seo-4d696b75/station_database)
//   （ekidata.jp 等に由来する公開データ。利用規約に従い出典を明記）
// 自動生成物。手で編集しないこと。再生成: node scripts/generate-station-geo.mjs
export const STATION_GEO = {
`;
let cur = '';
for (const c of codes) {
  const key = order.find(k => c.startsWith(k) && /^\d+$/.test(c.slice(k.length)));
  if (key !== cur) { if (cur) out += '\n'; cur = key; }
  out += `  "${c}": [${geo[c][0]}, ${geo[c][1]}],\n`;
}
out += `};\n`;

const outDir = join(ROOT, 'functions', '_lib');
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'stationGeo.js'), out);
console.log(`wrote functions/_lib/stationGeo.js (${codes.length} stations)`);
