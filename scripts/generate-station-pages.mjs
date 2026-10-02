// 東京・大阪・名古屋の全駅ぶんの駅別シェアページ (/s, /en/s, /zh/s と /osaka/s, /nagoya/s 等) と、
// 大阪・名古屋版のトップページ (/osaka/, /en/osaka/ …) を生成し、
// sitemap.xml に未掲載のURLがあれば追記するスクリプト。
//
// data/{city}.js の LINES/GUIDES/LINE_I18N を読み込んで生成する（駅名やガイド文を更新したときの再実行用）。
// 大阪・名古屋のトップページは東京版 (index.html, en/index.html, zh/index.html) をテンプレートにする。
// OGP画像は scripts/generate-og-images.mjs で別途生成する。
//
// 実行: node scripts/generate-station-pages.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// data/{id}.js はブラウザ用のクラシックスクリプト（トップレベル const）なので、関数で包んで値を取り出す
async function loadCity(id) {
  const src = await readFile(join(ROOT, 'data', `${id}.js`), 'utf8');
  return new Function(`${src}\nreturn { CITY_PATH, LINES, GUIDES, LINE_I18N };`)();
}

// 都市ごとの表記。pool は「どこから選ぶか」の説明（n = 路線数, m = 駅数）。
const CITIES = {
  tokyo: {
    ja: { site: 'メトロ駅ガチャ', city: '東京', area: '東京メトロ・都営地下鉄', pool: (n, m) => `全${n}路線・${m}駅`,
      disclaimer: '本サイトは非公式のファンサイトであり、東京地下鉄株式会社（東京メトロ）および東京都交通局とは一切関係ありません。' },
    en: { site: 'Metro Station Gacha', area: 'Tokyo Metro & Toei Subway', city: 'Tokyo', pool: (n, m) => `${m} Tokyo Metro & Toei Subway stations`,
      disclaimer: 'This is an unofficial fan site and is not affiliated with Tokyo Metro Co., Ltd. or the Tokyo Metropolitan Bureau of Transportation.' },
    zh: { site: '地铁站扭蛋', city: '东京', area: '东京地铁·都营地铁', pool: (n, m) => `东京地铁·都营地铁全部${m}个车站`,
      disclaimer: '本网站为非官方粉丝网站，与东京地下铁株式会社（东京Metro）及东京都交通局无任何关联。' },
  },
  osaka: {
    ja: { site: '大阪メトロ駅ガチャ', city: '大阪', area: '大阪メトロ', pool: (n, m) => `大阪メトロ全${n}路線・${m}駅`,
      disclaimer: '本サイトは非公式のファンサイトであり、大阪市高速電気軌道株式会社（Osaka Metro）とは一切関係ありません。' },
    en: { site: 'Osaka Metro Station Gacha', area: 'Osaka Metro', city: 'Osaka', pool: (n, m) => `${m} Osaka Metro stations`,
      disclaimer: 'This is an unofficial fan site and is not affiliated with Osaka Metro Co., Ltd.' },
    zh: { site: '大阪地铁站扭蛋', city: '大阪', area: '大阪地铁', pool: (n, m) => `大阪地铁全部${m}个车站`,
      disclaimer: '本网站为非官方粉丝网站，与大阪市高速电气轨道株式会社（Osaka Metro）无任何关联。' },
  },
  nagoya: {
    ja: { site: '名古屋市営地下鉄駅ガチャ', city: '名古屋', area: '名古屋市営地下鉄', pool: (n, m) => `名古屋市営地下鉄全${n}路線・${m}駅`,
      disclaimer: '本サイトは非公式のファンサイトであり、名古屋市交通局とは一切関係ありません。' },
    en: { site: 'Nagoya Municipal Subway Station Gacha', area: 'Transportation Bureau City of Nagoya', city: 'Nagoya', pool: (n, m) => `${m} stations of the Transportation Bureau City of Nagoya`,
      disclaimer: 'This is an unofficial fan site and is not affiliated with the Transportation Bureau City of Nagoya.' },
    zh: { site: '名古屋市营地铁站扭蛋', city: '名古屋', area: '名古屋市营地铁', pool: (n, m) => `名古屋市营地铁全部${m}个车站`,
      disclaimer: '本网站为非官方粉丝网站，与名古屋市交通局无任何关联。' },
  },
};

// app.js の stationCode と同じ駅ナンバリング
const stationCode = (line, i) => line.sym + String(i + (line.numStart || 1)).padStart(2, '0');

function mapsQuery(stationJa, lineNameJa) {
  return encodeURIComponent(`${stationJa}駅 ${lineNameJa}`);
}

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
    dir: '', htmlLang: 'ja', locale: 'ja_JP', site: p.c.ja.site, privacy: '/privacy/',
    lineName: p.lineNameJa, guide: p.guideJa,
    title: `${p.stationJa}駅（${p.lineNameJa} ${p.code}）が出ました！ | ${p.c.ja.site}`,
    description: `${p.c.ja.site}の結果は「${p.lineNameJa} ${p.stationJa}駅（${p.code}）」でした。${p.c.ja.pool(p.n, p.m)}からランダムに1駅を選ぶ無料Webアプリ。あなたも回してみよう！`,
    ogTitle: `${p.stationJa}駅が出ました！｜${p.c.ja.site}`,
    ogDescription: `ガチャ結果:「${p.lineNameJa} ${p.stationJa}駅（${p.code}）」。${p.c.ja.pool(p.n, p.m)}からランダムに1駅。あなたも回してみよう！`,
    stationLabel: `${p.stationJa}駅（${p.lineNameJa} ${p.code}）`,
    label: 'ガチャ結果', map: 'Googleマップで見る', go: '自分もガチャを回す 🎲',
    hotel: `${p.stationJa}駅周辺のホテルを探す`, prev: '前の駅', next: '次の駅',
    transfer: '乗り換え', onLine: `${p.lineNameJa}の駅一覧`,
    disclaimer: p.c.ja.disclaimer,
    privacyLabel: 'プライバシーポリシー',
  }),
  en: p => ({
    dir: 'en/', htmlLang: 'en', locale: 'en_US', site: p.c.en.site, privacy: '/en/privacy/',
    lineName: p.lineNameEn, guide: p.guideEn,
    title: `You got ${p.stationEn} Station (${p.lineNameEn} ${p.code})! | ${p.c.en.site}`,
    description: `${p.c.en.site} result: ${p.stationEn} Station (${p.lineNameEn}, ${p.code}). A free web app that picks one random station from ${p.c.en.pool(p.n, p.m)}. Spin yours!`,
    ogTitle: `You got ${p.stationEn} Station! | ${p.c.en.site}`,
    ogDescription: `Gacha result: ${p.stationEn} Station (${p.lineNameEn}, ${p.code}). One random pick from ${p.c.en.pool(p.n, p.m)} — try your luck!`,
    stationLabel: `${p.stationEn} Station (${p.lineNameEn} ${p.code})`,
    label: 'Gacha result', map: 'View on Google Maps', go: 'Spin the Gacha yourself 🎲',
    hotel: `Find hotels near ${p.stationEn} Station`, prev: 'Previous', next: 'Next',
    transfer: 'Transfers', onLine: `All ${p.lineNameEn} stations`,
    disclaimer: p.c.en.disclaimer,
    privacyLabel: 'Privacy Policy',
  }),
  zh: p => ({
    dir: 'zh/', htmlLang: 'zh-CN', locale: 'zh_CN', site: p.c.zh.site, privacy: '/en/privacy/',
    lineName: p.lineNameZh, guide: p.guideEn,
    title: `抽到了${p.stationJa}站（${p.lineNameZh} ${p.code}）！ | ${p.c.zh.site}`,
    description: `${p.c.zh.site}的结果是「${p.lineNameZh} ${p.stationJa}站（${p.code}）」。从${p.c.zh.pool(p.n, p.m)}中随机抽选1站的免费网页应用。你也来抽一发！`,
    ogTitle: `抽到了${p.stationJa}站！｜${p.c.zh.site}`,
    ogDescription: `扭蛋结果：「${p.lineNameZh} ${p.stationJa}站（${p.code}）」。从${p.m}个车站中随机抽选——你也试试手气！`,
    stationLabel: `${p.stationJa}站（${p.lineNameZh} ${p.code}）`,
    label: '抽选结果', map: '在谷歌地图中查看', go: '我也要转扭蛋 🎲',
    hotel: `查找${p.stationJa}站附近的酒店`, prev: '上一站', next: '下一站',
    transfer: '换乘', onLine: `${p.lineNameZh}车站一览`,
    disclaimer: p.c.zh.disclaimer,
    privacyLabel: '隐私政策',
  }),
};

// 楽天トラベルのホテル検索リンク。アフィリエイトIDは app.js の RAKUTEN_AFFILIATE_ID と共通。
const RAKUTEN_AFFILIATE_ID = (await readFile(join(ROOT, 'app.js'), 'utf8')).match(/const RAKUTEN_AFFILIATE_ID = '([^']*)'/)[1];
function hotelUrl(stationJa) {
  const url = `https://kw.travel.rakuten.co.jp/keyword/Search.do?charset=utf-8&f_query=${encodeURIComponent(stationJa + '駅')}`;
  return RAKUTEN_AFFILIATE_ID ? `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(url)}` : url;
}

// 前後の駅・乗り換え路線・同じ路線の駅一覧へのリンク（駅ページ同士の内部リンク）
function related(lang, p, s) {
  const { line, idx, LINES, LINE_I18N } = p;
  const href = (l, i) => `/${s.dir}${p.path}s/${stationCode(l, i)}/`;
  const stName = st => lang === 'en' ? st[1] : st[0];
  const lnName = l => lang === 'ja' ? l.name : LINE_I18N[l.key][lang];
  const chip = (l, i, text, current) => current
    ? `<span class="chip cur"><span class="dot" style="background:${l.color}"></span>${text}</span>`
    : `<a class="chip" href="${href(l, i)}"><span class="dot" style="background:${l.color}"></span>${text}</a>`;
  const prev = line.stations[idx - 1], next = line.stations[idx + 1];
  const transfers = LINES.flatMap(l => l === line ? [] : l.stations
    .map((st, i) => [l, i, st]).filter(([, , st]) => st[0] === p.stationJa));
  return `<nav class="rel">
    <div class="adj">${prev ? `<a href="${href(line, idx - 1)}">← ${s.prev}<b>${stName(prev)}</b></a>` : '<span></span>'}${next ? `<a class="next" href="${href(line, idx + 1)}">${s.next} →<b>${stName(next)}</b></a>` : ''}</div>
${transfers.length ? `    <h2>${s.transfer}</h2>
    <div class="chips">${transfers.map(([l, i]) => chip(l, i, `${lnName(l)} ${stationCode(l, i)}`)).join('')}</div>
` : ''}    <h2><a href="/${s.dir}${p.path}line/${line.key}/">${s.onLine} →</a></h2>
    <div class="chips">${line.stations.map((st, i) => chip(line, i, stName(st), i === idx)).join('')}</div>
  </nav>`;
}

const ANALYTICS = `<!-- Google tag (gtag.js) -->
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
`;

function page(lang, p) {
  const s = LANGS[lang](p);
  const { code, stationJa, stationEn, lineNameJa, lineColor, path } = p;
  const home = `/${s.dir}${path}`;
  const pageUrl = `https://metrandom.com/${s.dir}${path}s/${code}/`;
  return `<!DOCTYPE html>
<html lang="${s.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${ANALYTICS}<title>${s.title}</title>
<meta name="description" content="${s.description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<link rel="alternate" hreflang="ja" href="https://metrandom.com/${path}s/${code}/">
<link rel="alternate" hreflang="en" href="https://metrandom.com/en/${path}s/${code}/">
<link rel="alternate" hreflang="zh" href="https://metrandom.com/zh/${path}s/${code}/">
<link rel="alternate" hreflang="x-default" href="https://metrandom.com/en/${path}s/${code}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${s.site}">
<meta property="og:title" content="${s.ogTitle}">
<meta property="og:description" content="${s.ogDescription}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="https://metrandom.com/og/${path}${code}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${s.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${s.ogTitle}">
<meta name="twitter:description" content="${s.ogDescription}">
<meta name="twitter:image" content="https://metrandom.com/og/${path}${code}.jpg">
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
    siteUrl: `https://metrandom.com${home}`,
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
  <a class="hotel" href="${hotelUrl(stationJa)}" target="_blank" rel="sponsored nofollow noopener">🏨 ${s.hotel} <span class="pr-badge">PR</span></a>
  <a class="go" href="${home}">${s.go}</a>
  ${related(lang, p, s)}
  <footer>
    <p style="margin-bottom:8px">${s.disclaimer}</p>
    <a href="${home}">${s.site}</a> ・ <a href="${s.privacy}">${s.privacyLabel}</a>
  </footer>
</body>
</html>
`;
}

// 東京版トップページ (tpl) を都市版に書き換える。置換対象が見つからなければ止める。
function cityTop(tpl, { id, lang, dir, path, c, n, m, LINES, LINE_I18N }) {
  const s = c[lang];
  const name = l => lang === 'ja' ? l.name : LINE_I18N[l.key][lang];
  const names = LINES.map(name).join(lang === 'en' ? ', ' : '・');
  const T = {
    ja: {
      title: `${s.city}の駅ルーレット｜${s.site} - ${s.area}${m}駅からランダムに1駅`,
      description: `${s.area}全${n}路線${m}駅から、ルーレットで1駅をランダムに選ぶ駅ルーレット（ランダム駅メーカー）。${names}を路線で絞り込み可能。途中下車・お散歩・行き先決めに。`,
      keywords: `駅ルーレット,ランダム駅メーカー,${s.city} 駅 ルーレット,${s.area},ランダム,駅,ルーレット,路線,途中下車,散歩,${LINES.map(name).join(',')}`,
      li: l => `<a href="/${dir}${path}line/${l.key}/">${name(l)}（${l.sym}）</a>`,
      about: `${s.site}とは`,
      p1: `${s.area}の全${n}路線${m}駅の中から、ボタンひとつでランダムに1駅を選ぶ駅ルーレット（ランダム駅メーカー）です。行き先に迷ったときの途中下車、休日のお散歩コース選び、近場の小旅行、街歩きの目的地決めなどに使えます。路線を絞り込めば、特定の沿線だけから駅を選ぶこともできます。`,
      linesTitle: '対応している路線', howTitle: '使い方',
      how: '「ガチャを回す」ボタンを押すと、ルーレットのように路線と駅が回転し、最終的に1駅が決まります。上部の路線チップで個別にオン・オフを切り替えられます。直近の結果は履歴として表示されます。',
    },
    en: {
      title: `${s.city} Station Roulette | ${s.site} – Random Pick from ${m} Subway Stations`,
      description: `A ${s.city} station roulette that picks one random station from the ${m} stations across all ${n} ${s.area} lines — ${names}. Spin the gacha to find your next spot to explore in ${s.city}.`,
      keywords: `station roulette,${s.city} station roulette,random station generator,${s.area},random station,station picker,roulette,${s.city} sightseeing,${LINES.map(name).join(',')}`,
      li: l => `<a href="/${dir}${path}line/${l.key}/">${name(l)} (${l.sym})</a>`,
      about: `About ${s.site}`,
      p1: `A station roulette that picks one random station from the ${m} stations across all ${n} ${s.area} lines at the press of a button. Great for spontaneous stopovers, weekend walks, mini trips and choosing your next place to explore in ${s.city}. Filter by line to draw stations only from the ones you select. The name "gacha" comes from Japanese capsule-toy vending machines (gachapon) — you never know what comes out!`,
      linesTitle: 'Supported lines', howTitle: 'How to use',
      how: 'Press the "Spin the Gacha" button and the roulette will cycle through lines and stations before landing on one. Tap the line chips at the top to switch lines on or off. Your recent results are kept in the history.',
    },
    zh: {
      title: `${s.city}车站轮盘｜${s.site} - 从${s.area}${m}个车站随机抽选1站`,
      description: `${s.city}车站轮盘：只需按一下按钮，即可从${s.area}全部${n}条线路、${m}个车站中随机抽选1站——${names}。随性下车、城市漫步的好帮手。`,
      keywords: `车站轮盘,${s.city}车站轮盘,随机车站生成器,${s.area},随机,车站,轮盘,${LINES.map(name).join(',')}`,
      li: l => `<a href="/${dir}${path}line/${l.key}/">${name(l)}（${l.sym}）</a>`,
      about: `关于${s.site}`,
      p1: `只需按一下按钮，即可从${s.area}全部${n}条线路、${m}个车站中随机抽选1站的车站轮盘。适合随性下车、周末散步、近郊小旅行、为城市漫步挑选目的地等。还可以按线路筛选，只从特定线路中抽选车站。`,
      linesTitle: '支持的线路', howTitle: '使用方法',
      how: '按下「转扭蛋」按钮，线路和车站会像轮盘一样旋转，最终确定1站。点击上方的线路标签可单独切换。最近的结果会保存在历史记录中。',
    },
  }[lang];
  const attr = v => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const tokyo = CITIES.tokyo[lang];
  const steps = [
    [/<title>[^<]*<\/title>/, `<title>${T.title}</title>`],
    [/(<meta name="description" content=")[^"]*/, `$1${attr(T.description)}`],
    [/(<meta name="keywords" content=")[^"]*/, `$1${attr(T.keywords)}`],
    [/"https:\/\/metrandom\.com\/((?:en\/|zh\/)?)"/g, `"https://metrandom.com/$1${path}"`],
    [/(property="og:site_name" content=")[^"]*/, `$1${attr(s.site)}`],
    [/((?:property="og|name="twitter):title" content=")[^"]*/g, `$1${attr(T.title)}`],
    [/((?:property="og|name="twitter):description" content=")[^"]*/g, `$1${attr(T.description)}`],
    [/og-image\.png/g, `og-image-${id}.png`],
    [/("name": ")[^"]*/, `$1${s.site}`],
    [/("description": ")[^"]*/, `$1${T.description.replace(/"/g, '\\"')}`],
    [/(<h1 id="appTitle">🚇 )[^<]*/, `$1${s.site}`],
    [/ aria-current="page"/, ''],
    [`<a href="/${dir}${path}">`, `<a href="/${dir}${path}" aria-current="page">`],
    [/<section class="about">[\s\S]*?<\/section>/, `<section class="about">
    <h2 id="aboutTitle">${T.about}</h2>
    <p id="aboutP1">${T.p1}</p>
    <h2 id="aboutLinesTitle">${T.linesTitle}</h2>
    <ul id="aboutLines">
${LINES.map(l => `      <li>${T.li(l)}</li>`).join('\n')}
    </ul>
    <h2 id="howTitle">${T.howTitle}</h2>
    <p id="howP">${T.how}</p>
  </section>`],
    [`${tokyo.disclaimer}</p>\n    ${tokyo.site} ・`, `${s.disclaimer}</p>\n    ${s.site} ・`],
    ['/data/tokyo.js', `/data/${id}.js`],
  ];
  return steps.reduce((html, [from, to]) => {
    if (!(typeof from === 'string' ? html.includes(from) : from.test(html))) throw new Error(`cityTop(${id}/${lang}): ${from} not found`);
    if (from.global) from.lastIndex = 0;
    return html.replace(from, to);
  }, tpl);
}

// 路線ごとの駅一覧ページ (/line/G/, /osaka/line/M/ など)
function linePage(lang, { id, c, path, line, LINES, LINE_I18N, GUIDES }) {
  const dir = { ja: '', en: 'en/', zh: 'zh/' }[lang];
  const site = c[lang].site;
  const ln = lang === 'ja' ? line.name : LINE_I18N[line.key][lang];
  const k = line.stations.length;
  const first = line.stations[0], last = line.stations[k - 1];
  const T = {
    ja: {
      htmlLang: 'ja', locale: 'ja_JP', privacy: '/privacy/', privacyLabel: 'プライバシーポリシー', go: '自分もガチャを回す 🎲',
      title: `${ln}の駅一覧（全${k}駅）｜${site}`,
      description: `${ln}の全${k}駅（${first[0]}〜${last[0]}）を一覧で紹介。各駅の見どころをひとことで添えています。行き先に迷ったらガチャでランダムに1駅選べます。`,
      h1: `${ln}の駅一覧`, lead: `${first[0]}から${last[0]}まで全${k}駅`, others: 'ほかの路線',
    },
    en: {
      htmlLang: 'en', locale: 'en_US', privacy: '/en/privacy/', privacyLabel: 'Privacy Policy', go: 'Spin the Gacha yourself 🎲',
      title: `${ln} Stations — All ${k} Stops | ${site}`,
      description: `All ${k} stations on the ${ln} (${first[1]} to ${last[1]}), each with a one-line guide to what's nearby. Can't decide where to go? Spin the gacha for a random station.`,
      h1: `${ln} Stations`, lead: `${k} stations from ${first[1]} to ${last[1]}`, others: 'Other lines',
    },
    zh: {
      htmlLang: 'zh-CN', locale: 'zh_CN', privacy: '/en/privacy/', privacyLabel: '隐私政策', go: '我也要转扭蛋 🎲',
      title: `${ln}车站一览（共${k}站）｜${site}`,
      description: `介绍${ln}全部${k}个车站（${first[0]}～${last[0]}），并附上每站看点简介。拿不定主意时，可以用扭蛋随机抽选1站。`,
      h1: `${ln}车站一览`, lead: `从${first[0]}到${last[0]}，共${k}站`, others: '其他线路',
    },
  }[lang];
  const home = `/${dir}${path}`;
  const url = d => `https://metrandom.com/${d}${path}line/${line.key}/`;
  const stUrl = i => `/${dir}${path}s/${stationCode(line, i)}/`;
  const ogImage = `https://metrandom.com/${id === 'tokyo' ? 'og-image.png' : `og-image-${id}.png`}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: T.title,
    url: url(dir),
    inLanguage: lang,
    isPartOf: { '@type': 'WebApplication', name: site, url: `https://metrandom.com${home}` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: site, item: `https://metrandom.com${home}` },
        { '@type': 'ListItem', position: 2, name: T.h1 },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: k,
      itemListElement: line.stations.map((st, i) => ({
        '@type': 'ListItem', position: i + 1, name: lang === 'en' ? st[1] : st[0], url: `https://metrandom.com${stUrl(i)}`,
      })),
    },
  };
  return `<!DOCTYPE html>
<html lang="${T.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${ANALYTICS}<title>${T.title}</title>
<meta name="description" content="${T.description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url(dir)}">
<link rel="alternate" hreflang="ja" href="${url('')}">
<link rel="alternate" hreflang="en" href="${url('en/')}">
<link rel="alternate" hreflang="zh" href="${url('zh/')}">
<link rel="alternate" hreflang="x-default" href="${url('en/')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site}">
<meta property="og:title" content="${T.title}">
<meta property="og:description" content="${T.description}">
<meta property="og:url" content="${url(dir)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${T.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${T.title}">
<meta name="twitter:description" content="${T.description}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0f1626">
<!-- 構造化データ -->
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<link rel="stylesheet" href="/station.css">
</head>
<body class="line-page">
  <a class="site" href="${home}">🚇 ${site}</a>
  <h1><span class="dot" style="background:${line.color}"></span>${T.h1}</h1>
  <div class="label">${T.lead}</div>
  <ol class="stations">
${line.stations.map((st, i) => `    <li><a href="${stUrl(i)}"><span class="code" style="background:${line.color}">${stationCode(line, i)}</span><span class="nm"><b>${lang === 'en' ? st[1] : st[0]}</b><small>${lang === 'en' ? st[0] : st[1]}</small><span class="g">${(GUIDES[st[0]] || ['', ''])[lang === 'ja' ? 0 : 1]}</span></span></a></li>`).join('\n')}
  </ol>
  <a class="go" href="${home}">${T.go}</a>
  <nav class="rel">
    <h2>${T.others}</h2>
    <div class="chips">${LINES.filter(l => l !== line).map(l => `<a class="chip" href="/${dir}${path}line/${l.key}/"><span class="dot" style="background:${l.color}"></span>${lang === 'ja' ? l.name : LINE_I18N[l.key][lang]}</a>`).join('')}</div>
  </nav>
  <footer>
    <p style="margin-bottom:8px">${c[lang].disclaimer}</p>
    <a href="${home}">${site}</a> ・ <a href="${T.privacy}">${T.privacyLabel}</a>
  </footer>
</body>
</html>
`;
}

const stationsWritten = [];
const extraLocs = [];

for (const id of Object.keys(CITIES)) {
  const { CITY_PATH, LINES, GUIDES, LINE_I18N } = await loadCity(id);
  const c = CITIES[id];
  const n = LINES.length;
  const m = LINES.reduce((sum, l) => sum + l.stations.length, 0);
  for (const line of LINES) {
    const i18n = LINE_I18N[line.key];
    line.stations.forEach(([stationJa, stationEn], idx) => {
      const guide = GUIDES[stationJa] || ['', ''];
      stationsWritten.push({
        c, n, m,
        path: CITY_PATH,
        code: stationCode(line, idx),
        stationJa,
        stationEn,
        lineNameJa: line.name,
        lineNameEn: i18n.en,
        lineNameZh: i18n.zh,
        lineColor: line.color,
        guideJa: guide[0],
        guideEn: guide[1],
        line, idx, LINES, LINE_I18N,
      });
    });
  }
  for (const line of LINES) {
    for (const lang of Object.keys(LANGS)) {
      const dir = join(ROOT, LANGS[lang]({ c }).dir, CITY_PATH, 'line', line.key);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'index.html'), linePage(lang, { id, c, path: CITY_PATH, line, LINES, LINE_I18N, GUIDES }), 'utf8');
      extraLocs.push(`https://metrandom.com/${LANGS[lang]({ c }).dir}${CITY_PATH}line/${line.key}/`);
    }
  }
  if (id !== 'tokyo') {
    for (const lang of Object.keys(LANGS)) {
      const dir = LANGS[lang]({ c }).dir;
      await mkdir(join(ROOT, dir, CITY_PATH), { recursive: true });
      await writeFile(join(ROOT, dir, CITY_PATH, 'index.html'),
        cityTop(await readFile(join(ROOT, dir, 'index.html'), 'utf8'), { id, lang, dir, path: CITY_PATH, c, n, m, LINES, LINE_I18N }), 'utf8');
      extraLocs.push(`https://metrandom.com/${dir}${CITY_PATH}`);
    }
  }
}

for (const p of stationsWritten) {
  for (const lang of Object.keys(LANGS)) {
    const dir = join(ROOT, LANGS[lang](p).dir, p.path, 's', p.code);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), page(lang, p), 'utf8');
  }
}

console.log(`Wrote ${stationsWritten.length * 3} station share pages (${stationsWritten.length} stations x ja/en/zh) plus city top and line pages (${extraLocs.length}).`);

// ---------- sitemap.xml ----------
const sitemapPath = join(ROOT, 'sitemap.xml');
let sitemap = await readFile(sitemapPath, 'utf8');

const TODAY = new Date().toISOString().slice(0, 10);
function urlBlock(loc) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
}

const allLocs = extraLocs.concat(stationsWritten.flatMap(p => [
  `https://metrandom.com/${p.path}s/${p.code}/`,
  `https://metrandom.com/en/${p.path}s/${p.code}/`,
  `https://metrandom.com/zh/${p.path}s/${p.code}/`,
]));
const missingLocs = allLocs.filter(loc => !sitemap.includes(`<loc>${loc}</loc>`));

if (missingLocs.length === 0) {
  console.log('sitemap.xml already contains all station URLs, nothing to append.');
} else {
  sitemap = sitemap.replace('</urlset>', missingLocs.map(urlBlock).join('') + '</urlset>');
  await writeFile(sitemapPath, sitemap, 'utf8');
  console.log(`Appended ${missingLocs.length} URLs to sitemap.xml.`);
}
