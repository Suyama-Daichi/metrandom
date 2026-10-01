// 駅別シェアページ用のOGP画像 (og/{CITY_PATH}{code}.jpg) と都市版トップのOGP画像 (og-image-{city}.png) を
// ヘッドレス Chrome で生成するスクリプト（macOS 前提: Chrome と sips を使う。npm 依存なし）。
// 東京版の画像は生成済みのため、既定では大阪・名古屋のみ生成する。
//
// 実行: node scripts/generate-og-images.mjs [osaka] [nagoya]
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SITE = { osaka: ['大阪メトロ', '駅ガチャ'], nagoya: ['名古屋市営地下鉄', '駅ガチャ'] };
const cities = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SITE);

const icon = (await readFile(join(ROOT, 'favicon.svg'), 'utf8')).replace(/<\?xml[^>]*>/, '');
const stationCode = (line, i) => line.sym + String(i + (line.numStart || 1)).padStart(2, '0');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// 右側の路線図風の装飾（路線カラーの折れ線＋駅の点）
function motif(colors) {
  const paths = [
    'M700,640 L700,540 L820,420 L820,210 L940,90 L1220,90',
    'M900,640 L900,370 L1020,250 L1220,250',
    'M940,600 L1020,520 L1020,260 L1140,140 L1140,-10',
    'M1000,640 L1000,510 L1080,430 L1220,430',
  ];
  return `<svg width="1200" height="630" style="position:absolute;inset:0">${paths.map((d, i) => {
    const c = colors[i % colors.length];
    const dots = [...d.matchAll(/L(\d+),(\d+)/g)].slice(0, -1)
      .map(([, x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#9aa6c4" opacity=".5"/>`).join('');
    return `<path d="${d}" stroke="${c}" stroke-width="14" fill="none" opacity=".22" stroke-linejoin="round"/>${dots}`;
  }).join('')}</svg>`;
}

const frame = (body, colors) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800&display=block" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; color: #fff; font-family: 'M PLUS Rounded 1c', sans-serif; font-weight: 800;
  background: linear-gradient(160deg, #1f2a4a 0%, #0f1626 100%); }
.icon svg { width: 100%; height: 100%; display: block; }
</style></head><body>${motif(colors)}${body}</body></html>`;

function stationHtml(site, line, code, [ja, en]) {
  const size = ja.length <= 5 ? 96 : Math.max(52, Math.floor(560 / ja.length));
  return `
<div style="position:absolute;left:96px;top:56px;display:flex;align-items:center;gap:22px">
  <div class="icon" style="width:66px;height:66px">${icon}</div>
  <div style="color:#ffd84d;font-size:34px">${site.join('')}</div>
</div>
<div style="position:absolute;left:96px;top:150px;width:${size >= 96 ? 1000 : 680}px;font-size:${size}px;line-height:1.2;white-space:nowrap">${esc(ja)}</div>
<div style="position:absolute;left:98px;top:262px;color:#9aa6c4;font:700 30px -apple-system,'Helvetica Neue',sans-serif">${esc(en)}</div>
<div style="position:absolute;left:96px;top:326px;display:flex;align-items:center;gap:14px;background:${line.color};border-radius:999px;padding:12px 28px 12px 14px;font-size:30px">
  <span style="background:#fff;color:${line.color};border-radius:999px;padding:2px 14px;font-size:24px">${code}</span>${esc(line.name)}
</div>
<div style="position:absolute;right:96px;bottom:36px;color:#9aa6c4;font:500 26px Menlo,monospace">metrandom.com</div>`;
}

function topHtml(site, LINES, m) {
  return `
<div class="icon" style="position:absolute;left:120px;top:180px;width:110px;height:110px">${icon}</div>
<div style="position:absolute;left:300px;top:150px;font-size:76px;line-height:1.15">${site[0]}<br><span style="color:#ffb300">${site[1]}</span></div>
<div style="position:absolute;left:300px;top:420px;color:#c8d2ee;font-size:28px">${LINES.length}路線・${m}駅からランダムに1駅を選ぶ</div>
<div style="position:absolute;left:86px;top:500px;display:flex;align-items:center;gap:10px">${
  LINES.map(l => `<span style="width:26px;height:26px;border-radius:50%;background:${l.color}"></span>`).join('<span style="width:14px;height:2px;background:#4a5577"></span>')
}</div>`;
}

const work = join(tmpdir(), 'metrandom-og');
await mkdir(work, { recursive: true });

async function shoot(html, out) {
  const name = out.replace(/[^\w]/g, '_');
  const src = join(work, `${name}.html`), png = join(work, `${name}.png`);
  await writeFile(src, html);
  await run(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,630',
    '--virtual-time-budget=4000', `--screenshot=${png}`, `file://${src}`]);
  if (out.endsWith('.png')) await run('cp', [png, out]);
  else await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', png, '--out', out]);
}

for (const id of cities) {
  const src = await readFile(join(ROOT, 'data', `${id}.js`), 'utf8');
  const { CITY_PATH, LINES } = new Function(`${src}\nreturn { CITY_PATH, LINES };`)();
  const colors = LINES.map(l => l.color);
  const jobs = [];
  for (const line of LINES) line.stations.forEach((st, i) => {
    const code = stationCode(line, i);
    jobs.push([frame(stationHtml(SITE[id], line, code, st), colors), join(ROOT, 'og', CITY_PATH, `${code}.jpg`)]);
  });
  const m = jobs.length;
  jobs.push([frame(topHtml(SITE[id], LINES, m), colors), join(ROOT, `og-image-${id}.png`)]);
  await mkdir(join(ROOT, 'og', CITY_PATH), { recursive: true });
  // Chrome を同時に起動しすぎないよう 6 並列で処理する
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(([h, o]) => shoot(h, o)));
  console.log(`${id}: wrote ${m} station images + og-image-${id}.png`);
}
await rm(work, { recursive: true, force: true });
