// 全291駅ぶんの駅別シェアページ (/s, /en/s, /zh/s) を生成し、
// sitemap.xml に未掲載のURLがあれば追記するスクリプト。
//
// app.js の LINES/GUIDES/LINE_I18N を読み込んで、東京メトロ・都営地下鉄
// 両方の駅ページを再生成する（駅名やガイド文を更新したときの再実行用）。
// OGP画像 (og/{code}.jpg) は別途生成が必要（このスクリプトでは作らない）。
//
// 実行: node scripts/generate-station-pages.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const html = await readFile(join(ROOT, 'app.js'), 'utf8');

function extract(name) {
  const m = html.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\});\\n`));
  if (!m) throw new Error(`${name} not found in app.js`);
  return (0, eval)(`(${m[1]})`);
}
function extractLines() {
  const m = html.match(/const LINES = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('LINES not found in app.js');
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
// 駅別シェアページの構造化データ (WebPage + BreadcrumbList + about:TrainStation)。
// JSON.stringify を使うことで、記号を含む駅名・路線名でも安全にエスケープする。
function jsonLd({ lang, stationJa, stationEn, pageTitle, pageUrl, siteName, siteUrl, homeLabel, stationLabel }) {
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

// 言語ごとの差分。p は駅パラメータ。
const LANGS = {
  ja: p => ({
    dir: '', htmlLang: 'ja', locale: 'ja_JP', site: 'メトロ駅ガチャ', privacy: '/privacy/',
    lineName: p.lineNameJa, guide: p.guideJa,
    title: `${p.stationJa}駅（${p.lineNameJa} ${p.code}）が出ました！ | メトロ駅ガチャ`,
    description: `メトロ駅ガチャの結果は「${p.lineNameJa} ${p.stationJa}駅（${p.code}）」でした。全13路線・291駅からランダムに1駅を選ぶ無料Webアプリ。あなたも回してみよう！`,
    ogTitle: `${p.stationJa}駅が出ました！｜メトロ駅ガチャ`,
    ogDescription: `ガチャ結果:「${p.lineNameJa} ${p.stationJa}駅（${p.code}）」。全13路線・291駅からランダムに1駅。あなたも回してみよう！`,
    stationLabel: `${p.stationJa}駅（${p.lineNameJa} ${p.code}）`,
    label: 'ガチャ結果', map: 'Googleマップで見る', go: '自分もガチャを回す 🎲',
    disclaimer: '本サイトは非公式のファンサイトであり、東京地下鉄株式会社（東京メトロ）および東京都交通局とは一切関係ありません。',
    privacyLabel: 'プライバシーポリシー',
  }),
  en: p => ({
    dir: 'en/', htmlLang: 'en', locale: 'en_US', site: 'Metro Station Gacha', privacy: '/en/privacy/',
    lineName: p.lineNameEn, guide: p.guideEn,
    title: `You got ${p.stationEn} Station (${p.lineNameEn} ${p.code})! | Metro Station Gacha`,
    description: `Metro Station Gacha result: ${p.stationEn} Station (${p.lineNameEn}, ${p.code}). A free web app that picks one random station from 291 Tokyo Metro & Toei Subway stations. Spin yours!`,
    ogTitle: `You got ${p.stationEn} Station! | Metro Station Gacha`,
    ogDescription: `Gacha result: ${p.stationEn} Station (${p.lineNameEn}, ${p.code}). One random pick from 291 Tokyo Metro & Toei Subway stations — try your luck!`,
    stationLabel: `${p.stationEn} Station (${p.lineNameEn} ${p.code})`,
    label: 'Gacha result', map: 'View on Google Maps', go: 'Spin the Gacha yourself 🎲',
    disclaimer: 'This is an unofficial fan site and is not affiliated with Tokyo Metro Co., Ltd. or the Tokyo Metropolitan Bureau of Transportation.',
    privacyLabel: 'Privacy Policy',
  }),
  zh: p => ({
    dir: 'zh/', htmlLang: 'zh-CN', locale: 'zh_CN', site: '地铁站扭蛋', privacy: '/en/privacy/',
    lineName: p.lineNameZh, guide: p.guideEn,
    title: `抽到了${p.stationJa}站（${p.lineNameZh} ${p.code}）！ | 地铁站扭蛋`,
    description: `地铁站扭蛋的结果是「${p.lineNameZh} ${p.stationJa}站（${p.code}）」。从东京地铁·都营地铁全部291个车站中随机抽选1站的免费网页应用。你也来抽一发！`,
    ogTitle: `抽到了${p.stationJa}站！｜地铁站扭蛋`,
    ogDescription: `扭蛋结果：「${p.lineNameZh} ${p.stationJa}站（${p.code}）」。从291个车站中随机抽选——你也试试手气！`,
    stationLabel: `${p.stationJa}站（${p.lineNameZh} ${p.code}）`,
    label: '抽选结果', map: '在谷歌地图中查看', go: '我也要转扭蛋 🎲',
    disclaimer: '本网站为非官方粉丝网站，与东京地下铁株式会社（东京Metro）及东京都交通局无任何关联。',
    privacyLabel: '隐私政策',
  }),
};

function page(lang, p) {
  const s = LANGS[lang](p);
  const { code, stationJa, stationEn, lineNameJa, lineColor } = p;
  const home = `/${s.dir}`;
  const pageUrl = `https://metrandom.com/${s.dir}s/${code}/`;
  return `<!DOCTYPE html>
<html lang="${s.htmlLang}">
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
<title>${s.title}</title>
<meta name="description" content="${s.description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<link rel="alternate" hreflang="ja" href="https://metrandom.com/s/${code}/">
<link rel="alternate" hreflang="en" href="https://metrandom.com/en/s/${code}/">
<link rel="alternate" hreflang="zh" href="https://metrandom.com/zh/s/${code}/">
<link rel="alternate" hreflang="x-default" href="https://metrandom.com/en/s/${code}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${s.site}">
<meta property="og:title" content="${s.ogTitle}">
<meta property="og:description" content="${s.ogDescription}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="https://metrandom.com/og/${code}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${s.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${s.ogTitle}">
<meta name="twitter:description" content="${s.ogDescription}">
<meta name="twitter:image" content="https://metrandom.com/og/${code}.jpg">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0f1626">
<!-- 構造化データ -->
${jsonLd({
    lang,
    stationJa,
    stationEn,
    pageTitle: s.title,
    pageUrl,
    siteName: s.site,
    siteUrl: `https://metrandom.com/${s.dir}`,
    homeLabel: s.site,
    stationLabel: s.stationLabel,
  })}
<link rel="stylesheet" href="/station.css">
</head>
<body>
  <h1>🚇 ${s.site}</h1>
  <div class="label">${s.label}</div>
  <div class="card">
    <div class="line-badge" style="background:${lineColor}">
      <span class="sym" style="color:${lineColor}">${code}</span>${s.lineName}
    </div>
    <div class="station">${stationJa}</div>
    <div class="station-en">${stationEn}</div>
    <div class="guide">${s.guide}</div>
  </div>
  <a class="map" href="https://www.google.com/maps/search/?api=1&query=${mapsQuery(stationJa, lineNameJa)}" target="_blank" rel="noopener">📍 ${s.map}</a>
  <a class="go" href="${home}">${s.go}</a>
  <footer>
    <p style="margin-bottom:8px">${s.disclaimer}</p>
    <a href="${home}">${s.site}</a> ・ <a href="${s.privacy}">${s.privacyLabel}</a>
  </footer>
</body>
</html>
`;
}

const stationsWritten = [];

for (const line of LINES) {
  const i18n = LINE_I18N[line.key];
  line.stations.forEach(([stationJa, stationEn], idx) => {
    const code = line.sym + num2(idx);
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
  for (const lang of Object.keys(LANGS)) {
    const dir = join(ROOT, LANGS[lang](p).dir, 's', p.code);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), page(lang, p), 'utf8');
  }
}

console.log(`Wrote ${stationsWritten.length * 3} station share pages (${stationsWritten.length} stations x ja/en/zh).`);

// ---------- sitemap.xml ----------
const sitemapPath = join(ROOT, 'sitemap.xml');
let sitemap = await readFile(sitemapPath, 'utf8');

const TODAY = new Date().toISOString().slice(0, 10);
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
