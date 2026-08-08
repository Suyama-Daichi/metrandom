// 全291駅ぶんの駅別シェアページ (/s, /en/s, /zh/s) を生成し、
// sitemap.xml に未掲載のURLがあれば追記するスクリプト。
//
// index.html の LINES/GUIDES/LINE_I18N を読み込んで、東京メトロ・都営地下鉄
// 両方の駅ページを再生成する（駅名やガイド文を更新したときの再実行用）。
// OGP画像 (og/{code}.jpg) は別途生成が必要（このスクリプトでは作らない）。
//
// 実行: node scripts/generate-station-pages.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const html = await readFile(join(ROOT, 'index.html'), 'utf8');

function extract(name) {
  const m = html.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\});\\n`));
  if (!m) throw new Error(`${name} not found in index.html`);
  return (0, eval)(`(${m[1]})`);
}
function extractLines() {
  const m = html.match(/const LINES = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('LINES not found in index.html');
  return (0, eval)(m[1]);
}

const LINES = extractLines();
const GUIDES = extract('GUIDES');
const LINE_I18N = extract('LINE_I18N');

const num2 = i => String(i + 1).padStart(2, '0');

function mapsQuery(stationJa, lineNameJa) {
  return encodeURIComponent(`${stationJa}駅 ${lineNameJa}`);
}

// 駅別シェアページの構造化データ (WebPage + BreadcrumbList + about:TrainStation)。
// JSON.stringify を使うことで、記号を含む駅名・路線名でも安全にエスケープする。
function jsonLd({ lang, code, stationJa, stationEn, lineNameJa, lineNameLocal, pageTitle, pageUrl, siteName, siteUrl, homeLabel, stationLabel }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    url: pageUrl,
    inLanguage: lang,
    isPartOf: { '@type': 'WebApplication', name: siteName, url: siteUrl },
    about: {
      '@type': 'TrainStation',
      name: stationJa,
      alternateName: stationEn,
      url: pageUrl,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: homeLabel, item: siteUrl },
        { '@type': 'ListItem', position: 2, name: stationLabel },
      ],
    },
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

function pageJa({ code, stationJa, stationEn, lineNameJa, lineColor, guideJa }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZFZ05FF6E9"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ZFZ05FF6E9');
</script>
<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "x2pr31qy85");
</script>
<title>${stationJa}駅（${lineNameJa} ${code}）が出ました！ | メトロ駅ガチャ</title>
<meta name="description" content="メトロ駅ガチャの結果は「${lineNameJa} ${stationJa}駅（${code}）」でした。全13路線・291駅からランダムに1駅を選ぶ無料Webアプリ。あなたも回してみよう！">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://metrandom.com/s/${code}/">
<link rel="alternate" hreflang="ja" href="https://metrandom.com/s/${code}/">
<link rel="alternate" hreflang="en" href="https://metrandom.com/en/s/${code}/">
<link rel="alternate" hreflang="zh" href="https://metrandom.com/zh/s/${code}/">
<link rel="alternate" hreflang="x-default" href="https://metrandom.com/en/s/${code}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="メトロ駅ガチャ">
<meta property="og:title" content="${stationJa}駅が出ました！｜メトロ駅ガチャ">
<meta property="og:description" content="ガチャ結果:「${lineNameJa} ${stationJa}駅（${code}）」。全13路線・291駅からランダムに1駅。あなたも回してみよう！">
<meta property="og:url" content="https://metrandom.com/s/${code}/">
<meta property="og:image" content="https://metrandom.com/og/${code}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${stationJa}駅が出ました！｜メトロ駅ガチャ">
<meta name="twitter:description" content="ガチャ結果:「${lineNameJa} ${stationJa}駅（${code}）」。全13路線・291駅からランダムに1駅。あなたも回してみよう！">
<meta name="twitter:image" content="https://metrandom.com/og/${code}.jpg">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0f1626">
<!-- 構造化データ -->
${jsonLd({
    lang: 'ja',
    code,
    stationJa,
    stationEn,
    pageTitle: `${stationJa}駅（${lineNameJa} ${code}）が出ました！ | メトロ駅ガチャ`,
    pageUrl: `https://metrandom.com/s/${code}/`,
    siteName: 'メトロ駅ガチャ',
    siteUrl: 'https://metrandom.com/',
    homeLabel: 'メトロ駅ガチャ',
    stationLabel: `${stationJa}駅（${lineNameJa} ${code}）`,
  })}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    background: linear-gradient(160deg, #1a2238 0%, #0f1626 100%); color: #fff; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px 48px; }
  h1 { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
  .label { color: #9aa6c4; font-size: .8rem; margin-bottom: 20px; }
  .card { width: 100%; max-width: 420px; background: rgba(255,255,255,.06); border-radius: 24px;
    padding: 36px 28px; text-align: center; border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 20px 60px rgba(0,0,0,.4); }
  .line-badge { display: inline-flex; align-items: center; gap: 10px; padding: 8px 18px;
    border-radius: 999px; font-weight: 700; font-size: 1rem; margin-bottom: 18px; color: #fff; }
  .line-badge .sym { width: 44px; height: 30px; border-radius: 15px; background: #fff;
    display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: .85rem; }
  .station { font-size: 2.6rem; font-weight: 800; line-height: 1.15; margin-bottom: 8px; }
  .station-en { color: #9aa6c4; font-size: .95rem; letter-spacing: .05em; }
  .guide { margin-top: 14px; color: #b6c0db; font-size: .85rem; line-height: 1.6; }
  a.map { display: inline-block; margin-top: 20px; padding: 12px 32px; font-size: .95rem;
    border: 1px solid rgba(255,255,255,.25); border-radius: 999px; color: #d4dcf0; text-decoration: none; }
  a.go { display: inline-block; margin-top: 16px; padding: 16px 48px; font-size: 1.1rem; font-weight: 700;
    border-radius: 999px; color: #1a2238; text-decoration: none;
    background: linear-gradient(135deg, #ffd84d, #ffb300); box-shadow: 0 8px 24px rgba(255,180,0,.35); }
  footer { margin-top: 36px; color: #6b769a; font-size: .78rem; text-align: center; }
  footer a { color: #9aa6c4; }
</style>
</head>
<body>
  <h1>🚇 メトロ駅ガチャ</h1>
  <div class="label">ガチャ結果</div>
  <div class="card">
    <div class="line-badge" style="background:${lineColor}">
      <span class="sym" style="color:${lineColor}">${code}</span>${lineNameJa}
    </div>
    <div class="station">${stationJa}</div>
    <div class="station-en">${stationEn}</div>
    <div class="guide">${guideJa}</div>
  </div>
  <a class="map" href="https://www.google.com/maps/search/?api=1&query=${mapsQuery(stationJa, lineNameJa)}" target="_blank" rel="noopener">📍 Googleマップで見る</a>
  <a class="go" href="/">自分もガチャを回す 🎲</a>
  <footer>
    <p style="margin-bottom:8px">本サイトは非公式のファンサイトであり、東京地下鉄株式会社（東京メトロ）および東京都交通局とは一切関係ありません。</p>
    <a href="/">メトロ駅ガチャ</a> ・ <a href="/privacy/">プライバシーポリシー</a>
  </footer>
</body>
</html>
`;
}

function pageEn({ code, stationJa, stationEn, lineNameJa, lineNameEn, lineColor, guideEn }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZFZ05FF6E9"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ZFZ05FF6E9');
</script>
<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "x2pr31qy85");
</script>
<title>You got ${stationEn} Station (${lineNameEn} ${code})! | Metro Station Gacha</title>
<meta name="description" content="Metro Station Gacha result: ${stationEn} Station (${lineNameEn}, ${code}). A free web app that picks one random station from 291 Tokyo Metro & Toei Subway stations. Spin yours!">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://metrandom.com/en/s/${code}/">
<link rel="alternate" hreflang="ja" href="https://metrandom.com/s/${code}/">
<link rel="alternate" hreflang="en" href="https://metrandom.com/en/s/${code}/">
<link rel="alternate" hreflang="zh" href="https://metrandom.com/zh/s/${code}/">
<link rel="alternate" hreflang="x-default" href="https://metrandom.com/en/s/${code}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Metro Station Gacha">
<meta property="og:title" content="You got ${stationEn} Station! | Metro Station Gacha">
<meta property="og:description" content="Gacha result: ${stationEn} Station (${lineNameEn}, ${code}). One random pick from 291 Tokyo Metro & Toei Subway stations — try your luck!">
<meta property="og:url" content="https://metrandom.com/en/s/${code}/">
<meta property="og:image" content="https://metrandom.com/og/${code}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="You got ${stationEn} Station! | Metro Station Gacha">
<meta name="twitter:description" content="Gacha result: ${stationEn} Station (${lineNameEn}, ${code}). One random pick from 291 Tokyo Metro & Toei Subway stations — try your luck!">
<meta name="twitter:image" content="https://metrandom.com/og/${code}.jpg">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0f1626">
<!-- 構造化データ -->
${jsonLd({
    lang: 'en',
    code,
    stationJa,
    stationEn,
    pageTitle: `You got ${stationEn} Station (${lineNameEn} ${code})! | Metro Station Gacha`,
    pageUrl: `https://metrandom.com/en/s/${code}/`,
    siteName: 'Metro Station Gacha',
    siteUrl: 'https://metrandom.com/en/',
    homeLabel: 'Metro Station Gacha',
    stationLabel: `${stationEn} Station (${lineNameEn} ${code})`,
  })}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    background: linear-gradient(160deg, #1a2238 0%, #0f1626 100%); color: #fff; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px 48px; }
  h1 { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
  .label { color: #9aa6c4; font-size: .8rem; margin-bottom: 20px; }
  .card { width: 100%; max-width: 420px; background: rgba(255,255,255,.06); border-radius: 24px;
    padding: 36px 28px; text-align: center; border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 20px 60px rgba(0,0,0,.4); }
  .line-badge { display: inline-flex; align-items: center; gap: 10px; padding: 8px 18px;
    border-radius: 999px; font-weight: 700; font-size: 1rem; margin-bottom: 18px; color: #fff; }
  .line-badge .sym { width: 44px; height: 30px; border-radius: 15px; background: #fff;
    display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: .85rem; }
  .station { font-size: 2.6rem; font-weight: 800; line-height: 1.15; margin-bottom: 8px; }
  .station-en { color: #9aa6c4; font-size: .95rem; letter-spacing: .05em; }
  .guide { margin-top: 14px; color: #b6c0db; font-size: .85rem; line-height: 1.6; }
  a.map { display: inline-block; margin-top: 20px; padding: 12px 32px; font-size: .95rem;
    border: 1px solid rgba(255,255,255,.25); border-radius: 999px; color: #d4dcf0; text-decoration: none; }
  a.go { display: inline-block; margin-top: 16px; padding: 16px 48px; font-size: 1.1rem; font-weight: 700;
    border-radius: 999px; color: #1a2238; text-decoration: none;
    background: linear-gradient(135deg, #ffd84d, #ffb300); box-shadow: 0 8px 24px rgba(255,180,0,.35); }
  footer { margin-top: 36px; color: #6b769a; font-size: .78rem; text-align: center; }
  footer a { color: #9aa6c4; }
</style>
</head>
<body>
  <h1>🚇 Metro Station Gacha</h1>
  <div class="label">Gacha result</div>
  <div class="card">
    <div class="line-badge" style="background:${lineColor}">
      <span class="sym" style="color:${lineColor}">${code}</span>${lineNameEn}
    </div>
    <div class="station">${stationJa}</div>
    <div class="station-en">${stationEn}</div>
    <div class="guide">${guideEn}</div>
  </div>
  <a class="map" href="https://www.google.com/maps/search/?api=1&query=${mapsQuery(stationJa, lineNameJa)}" target="_blank" rel="noopener">📍 View on Google Maps</a>
  <a class="go" href="/en/">Spin the Gacha yourself 🎲</a>
  <footer>
    <p style="margin-bottom:8px">This is an unofficial fan site and is not affiliated with Tokyo Metro Co., Ltd. or the Tokyo Metropolitan Bureau of Transportation.</p>
    <a href="/en/">Metro Station Gacha</a> ・ <a href="/en/privacy/">Privacy Policy</a>
  </footer>
</body>
</html>
`;
}

function pageZh({ code, stationJa, stationEn, lineNameJa, lineNameZh, lineColor, guideEn }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZFZ05FF6E9"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ZFZ05FF6E9');
</script>
<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "x2pr31qy85");
</script>
<title>抽到了${stationJa}站（${lineNameZh} ${code}）！ | 地铁站扭蛋</title>
<meta name="description" content="地铁站扭蛋的结果是「${lineNameZh} ${stationJa}站（${code}）」。从东京地铁·都营地铁全部291个车站中随机抽选1站的免费网页应用。你也来抽一发！">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://metrandom.com/zh/s/${code}/">
<link rel="alternate" hreflang="ja" href="https://metrandom.com/s/${code}/">
<link rel="alternate" hreflang="en" href="https://metrandom.com/en/s/${code}/">
<link rel="alternate" hreflang="zh" href="https://metrandom.com/zh/s/${code}/">
<link rel="alternate" hreflang="x-default" href="https://metrandom.com/en/s/${code}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="地铁站扭蛋">
<meta property="og:title" content="抽到了${stationJa}站！｜地铁站扭蛋">
<meta property="og:description" content="扭蛋结果：「${lineNameZh} ${stationJa}站（${code}）」。从291个车站中随机抽选——你也试试手气！">
<meta property="og:url" content="https://metrandom.com/zh/s/${code}/">
<meta property="og:image" content="https://metrandom.com/og/${code}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="抽到了${stationJa}站！｜地铁站扭蛋">
<meta name="twitter:description" content="扭蛋结果：「${lineNameZh} ${stationJa}站（${code}）」。从291个车站中随机抽选——你也试试手气！">
<meta name="twitter:image" content="https://metrandom.com/og/${code}.jpg">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0f1626">
<!-- 構造化データ -->
${jsonLd({
    lang: 'zh',
    code,
    stationJa,
    stationEn,
    pageTitle: `抽到了${stationJa}站（${lineNameZh} ${code}）！ | 地铁站扭蛋`,
    pageUrl: `https://metrandom.com/zh/s/${code}/`,
    siteName: '地铁站扭蛋',
    siteUrl: 'https://metrandom.com/zh/',
    homeLabel: '地铁站扭蛋',
    stationLabel: `${stationJa}站（${lineNameZh} ${code}）`,
  })}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    background: linear-gradient(160deg, #1a2238 0%, #0f1626 100%); color: #fff; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px 48px; }
  h1 { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
  .label { color: #9aa6c4; font-size: .8rem; margin-bottom: 20px; }
  .card { width: 100%; max-width: 420px; background: rgba(255,255,255,.06); border-radius: 24px;
    padding: 36px 28px; text-align: center; border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 20px 60px rgba(0,0,0,.4); }
  .line-badge { display: inline-flex; align-items: center; gap: 10px; padding: 8px 18px;
    border-radius: 999px; font-weight: 700; font-size: 1rem; margin-bottom: 18px; color: #fff; }
  .line-badge .sym { width: 44px; height: 30px; border-radius: 15px; background: #fff;
    display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: .85rem; }
  .station { font-size: 2.6rem; font-weight: 800; line-height: 1.15; margin-bottom: 8px; }
  .station-en { color: #9aa6c4; font-size: .95rem; letter-spacing: .05em; }
  .guide { margin-top: 14px; color: #b6c0db; font-size: .85rem; line-height: 1.6; }
  a.map { display: inline-block; margin-top: 20px; padding: 12px 32px; font-size: .95rem;
    border: 1px solid rgba(255,255,255,.25); border-radius: 999px; color: #d4dcf0; text-decoration: none; }
  a.go { display: inline-block; margin-top: 16px; padding: 16px 48px; font-size: 1.1rem; font-weight: 700;
    border-radius: 999px; color: #1a2238; text-decoration: none;
    background: linear-gradient(135deg, #ffd84d, #ffb300); box-shadow: 0 8px 24px rgba(255,180,0,.35); }
  footer { margin-top: 36px; color: #6b769a; font-size: .78rem; text-align: center; }
  footer a { color: #9aa6c4; }
</style>
</head>
<body>
  <h1>🚇 地铁站扭蛋</h1>
  <div class="label">抽选结果</div>
  <div class="card">
    <div class="line-badge" style="background:${lineColor}">
      <span class="sym" style="color:${lineColor}">${code}</span>${lineNameZh}
    </div>
    <div class="station">${stationJa}</div>
    <div class="station-en">${stationEn}</div>
    <div class="guide">${guideEn}</div>
  </div>
  <a class="map" href="https://www.google.com/maps/search/?api=1&query=${mapsQuery(stationJa, lineNameJa)}" target="_blank" rel="noopener">📍 在谷歌地图中查看</a>
  <a class="go" href="/zh/">我也要转扭蛋 🎲</a>
  <footer>
    <p style="margin-bottom:8px">本网站为非官方粉丝网站，与东京地下铁株式会社（东京Metro）及东京都交通局无任何关联。</p>
    <a href="/zh/">地铁站扭蛋</a> ・ <a href="/en/privacy/">隐私政策</a>
  </footer>
</body>
</html>
`;
}

const stationsWritten = [];

for (const line of LINES) {
  const i18n = LINE_I18N[line.key];
  line.stations.forEach(([stationJa, stationEn], idx) => {
    const code = line.key + num2(idx);
    const guide = GUIDES[stationJa] || ['', ''];
    const params = {
      code,
      stationJa,
      stationEn,
      lineNameJa: line.name,
      lineNameEn: i18n.en,
      lineNameZh: i18n.zh,
      lineColor: line.color,
      guideJa: guide[0],
      guideEn: guide[1],
    };
    stationsWritten.push(params);
  });
}

for (const p of stationsWritten) {
  const jaDir = join(ROOT, 's', p.code);
  const enDir = join(ROOT, 'en', 's', p.code);
  const zhDir = join(ROOT, 'zh', 's', p.code);
  await mkdir(jaDir, { recursive: true });
  await mkdir(enDir, { recursive: true });
  await mkdir(zhDir, { recursive: true });
  await writeFile(join(jaDir, 'index.html'), pageJa(p), 'utf8');
  await writeFile(join(enDir, 'index.html'), pageEn(p), 'utf8');
  await writeFile(join(zhDir, 'index.html'), pageZh(p), 'utf8');
}

console.log(`Wrote ${stationsWritten.length * 3} station share pages (${stationsWritten.length} stations x ja/en/zh).`);

// ---------- sitemap.xml ----------
const sitemapPath = join(ROOT, 'sitemap.xml');
let sitemap = await readFile(sitemapPath, 'utf8');

const TODAY = '2026-08-08';
function urlBlock(loc) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
}

const allLocs = stationsWritten.flatMap(p => [
  `https://metrandom.com/s/${p.code}/`,
  `https://metrandom.com/en/s/${p.code}/`,
  `https://metrandom.com/zh/s/${p.code}/`,
]);
const missingLocs = allLocs.filter(loc => !sitemap.includes(`<loc>${loc}</loc>`));

if (missingLocs.length === 0) {
  console.log('sitemap.xml already contains all station URLs, nothing to append.');
} else {
  sitemap = sitemap.replace('</urlset>', missingLocs.map(urlBlock).join('') + '</urlset>');
  await writeFile(sitemapPath, sitemap, 'utf8');
  console.log(`Appended ${missingLocs.length} URLs to sitemap.xml.`);
}
