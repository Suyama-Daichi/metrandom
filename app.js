// ---------- i18n ----------

const T = {
  ja: {
    copy: 'リンクをコピー',
    copied: 'コピーしました ✓',
    mapLink: 'Googleマップで見る',
    hotel: st => `${st[0]}駅周辺のホテルを探す`,
    restore: 'この駅を表示',
    nearby: ['周辺のお店（チェーン店以外）', 'カフェ', '公園', '観光スポット'],
    share: r => `メトロ駅ガチャの結果は「${lineName(r.line)} ${r.st[0]}駅（${stationCode(r.line, r.idx)}）」でした！🚇 #メトロ駅ガチャ`
  },
  en: {
    copy: 'Copy link',
    copied: 'Copied ✓',
    mapLink: 'View on Google Maps',
    hotel: st => `Find hotels near ${st[1]} Station`,
    restore: 'Show this station',
    nearby: ['Local eats (no chains)', 'Cafes', 'Parks', 'Sights'],
    share: r => `I spun the Metro Station Gacha and got "${r.st[1]} Station (${lineName(r.line)}, ${stationCode(r.line, r.idx)})"! 🚇 #MetroStationGacha`
  },
  zh: {
    copy: '复制链接',
    copied: '已复制 ✓',
    mapLink: '在谷歌地图中查看',
    hotel: st => `查找${st[0]}站附近的酒店`,
    restore: '显示该车站',
    nearby: ['周边小店（非连锁）', '咖啡馆', '公园', '观光景点'],
    share: r => `地铁站扭蛋抽到了「${r.st[0]}站（${lineName(r.line)} ${stationCode(r.line, r.idx)}）」！🚇 #地铁站扭蛋`
  }
};

// このページのURLが示す言語を常に表示（/ = ja, /en/ = en, /zh/ = zh）
const lang = document.documentElement.lang.slice(0, 2);

function t(key){ return T[lang][key]; }
// 駅ナンバリング（例: G01）。大阪メトロのように 01 始まりでない路線は numStart で指定する。
function stationCode(line, i){ return line.key + String(i + (line.numStart || 1)).padStart(2,'0'); }
function lineName(line){ return lang === 'ja' ? line.name : LINE_I18N[line.key][lang]; }
function opName(op){ return lang === 'ja' ? op.name : OP_I18N[op.key][lang]; }
// ---------- /i18n ----------

const opsEl = document.getElementById('ops');
const linesEl = document.getElementById('lines');
const active = new Set(LINES.map(l=>l.key));
const chipEls = [];
const opChipEls = [];

// 事業者チップ: 配下の路線をまとめてオン・オフする
OPERATORS.forEach(op=>{
  const c = document.createElement('div');
  c.className = 'op-chip';
  c.dataset.op = op.key;
  c.onclick = ()=>{
    const keys = LINES.filter(l=>l.op === op.key).map(l=>l.key);
    const on = keys.filter(k=>active.has(k));
    if(on.length){
      if(on.length >= active.size) return; // 全路線オフになる操作は無視
      keys.forEach(k=>active.delete(k));
    } else {
      keys.forEach(k=>active.add(k));
    }
    syncChips();
  };
  c.textContent = opName(op);
  opChipEls.push([c, op]);
  opsEl.appendChild(c);
});
// 事業者が1つだけの都市（大阪・名古屋）では事業者チップは不要
opsEl.hidden = OPERATORS.length < 2;

LINES.forEach((l, i)=>{
  // 事業者の切れ目に縦の区切り線を入れる
  if(i && LINES[i-1].op !== l.op) linesEl.appendChild(Object.assign(document.createElement('span'), {className: 'sep'}));
  const c = document.createElement('div');
  c.className = 'chip';
  c.dataset.key = l.key;
  c.innerHTML = `<span class="dot" style="background:${l.color}"></span>${lineName(l).replace(/ Line$/, "")}`;
  c.onclick = ()=>{
    if(active.has(l.key)){ if(active.size>1) active.delete(l.key); }
    else active.add(l.key);
    syncChips();
  };
  chipEls.push([c, l]);
  linesEl.appendChild(c);
});

// active の内容をチップの表示状態へ反映する
function syncChips(){
  chipEls.forEach(([c, l])=> c.classList.toggle('off', !active.has(l.key)));
  opChipEls.forEach(([c, op])=>
    c.classList.toggle('off', !LINES.some(l=>l.op === op.key && active.has(l.key))));
}

const card = document.getElementById('card');
const go = document.getElementById('go');
const histEl = document.getElementById('hist');
const histHead = document.getElementById('histHead');
const histClear = document.getElementById('histClear');
const histEmpty = document.getElementById('histEmpty');

// ---------- ハンバーガーメニュー（履歴ドロワー: <dialog> が Esc・背景・フォーカスを面倒みる） ----------
const drawer = document.getElementById('drawer');
document.getElementById('menuBtn').onclick = ()=> drawer.showModal();
document.getElementById('drawerClose').onclick = ()=> drawer.close();
// 背景 (::backdrop) のクリックは dialog 自身へのクリックとして届く
drawer.addEventListener('click', e=>{ if(e.target === drawer) drawer.close(); });

const LINE_MAP = Object.fromEntries(LINES.map(l=>[l.key, l]));
const HIST_KEY = 'metroGachaHistory' + CITY_PATH.replace('/', ''); // 都市ごとに別の履歴
const HIST_MAX = 10;
let history = [];
try {
  const saved = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
  if (Array.isArray(saved)) {
    history = saved.filter(h => h && LINE_MAP[h.k] && LINE_MAP[h.k].stations[h.i]).slice(0, HIST_MAX);
  }
} catch(e) { history = []; }

function saveHist(){
  try {
    if (history.length) localStorage.setItem(HIST_KEY, JSON.stringify(history));
    else localStorage.removeItem(HIST_KEY);
  } catch(e) { /* プライベートモード等で保存できない場合は無視 */ }
}

function renderHist(){
  const empty = history.length === 0;
  histHead.hidden = empty;
  histEmpty.hidden = !empty;
  histEl.innerHTML = history.map((h, i)=>{
    const line = LINE_MAP[h.k];
    const st = line.stations[h.i];
    const stName = lang === 'en' ? st[1] : st[0];
    return `<div class="hist-item"><button class="hist-restore" data-i="${i}" type="button" title="${t('restore')}"><span class="d" style="background:${line.color}"></span>${stName} <span style="color:#8a96b8">（${lineName(line)} ${stationCode(line, h.i)}）</span></button><button class="hist-del" data-i="${i}" type="button" aria-label="delete">✕</button></div>`;
  }).join('');
}

histEl.addEventListener('click', e=>{
  const del = e.target.closest('.hist-del');
  if(del){
    history.splice(Number(del.dataset.i), 1);
    saveHist();
    renderHist();
    return;
  }
  const restore = e.target.closest('.hist-restore');
  if(!restore) return;
  const h = history[Number(restore.dataset.i)];
  const line = h && LINE_MAP[h.k];
  if(!line || !line.stations[h.i]) return;
  const r = { line, st: line.stations[h.i], idx: h.i };
  render(r, false);
  updateShare(r);
  drawer.close();
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

histClear.onclick = ()=>{
  history = [];
  saveHist();
  renderHist();
};

const shareEl = document.getElementById('share');
const shareX = document.getElementById('shareX');
const shareLine = document.getElementById('shareLine');
const shareCopy = document.getElementById('shareCopy');


// 結果の共有URL。全駅に静的な結果ページがあるためそちらを使う。
function shareUrl(r){
  return `https://metrandom.com/${lang === 'ja' ? '' : lang + '/'}${CITY_PATH}s/${stationCode(r.line, r.idx)}/`;
}
function updateShare(r){
  const text = T[lang].share(r);
  const resultUrl = shareUrl(r);
  const full = text + ' ' + resultUrl;
  shareX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(resultUrl)}`;
  shareLine.href = `https://line.me/R/share?text=${encodeURIComponent(full)}`;
  shareCopy.textContent = t('copy');
  shareCopy.onclick = async ()=>{
    try {
      if (navigator.share) { await navigator.share({ text, url: resultUrl }); return; }
      await navigator.clipboard.writeText(full);
      shareCopy.textContent = t('copied');
      setTimeout(()=>{ shareCopy.textContent = t('copy'); }, 1600);
    } catch(e){ /* ユーザーがキャンセルした場合などは無視 */ }
  };
  shareEl.hidden = false;
}

function pick(){
  // 全駅均等: 有効路線の全駅を1つのプールにして一律確率で選ぶ
  const pool = [];
  LINES.forEach(l => {
    if (!active.has(l.key)) return;
    l.stations.forEach((st, idx) => pool.push({ line: l, st, idx }));
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

// 楽天トラベルのホテル検索（楽天アフィリエイト経由）
// （scripts/generate-station-pages.mjs もこの値を読んで駅ページに使う）
const RAKUTEN_AFFILIATE_ID = '5516128b.31e208e8.5516128c.89a7d37f';
function hotelUrl(stationJa){
  const url = `https://kw.travel.rakuten.co.jp/keyword/Search.do?charset=utf-8&f_query=${encodeURIComponent(stationJa + '駅')}`;
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(url)}`;
}

function render(r, spinning){
  const code = stationCode(r.line, r.idx);
  card.className = 'card' + (spinning?' spinning':'');
  card.innerHTML = `
    <div class="line-badge" style="background:${r.line.color}">
      <span class="sym" style="color:${r.line.color}">${code}</span>${lineName(r.line)}
    </div>
    <div class="station">${r.st[0]}</div>
    <div class="station-en">${r.st[1]}</div>
    <div class="num">${lineName(r.line)} ${code}</div>
    ${spinning ? '' : `<div class="card-guide">${(GUIDES[r.st[0]] || ['',''])[lang === 'ja' ? 0 : 1]}</div><a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.st[0]+'駅 '+r.line.name)}" target="_blank" rel="noopener">📍 ${t('mapLink')}</a><a class="hotel-link" href="${hotelUrl(r.st[0])}" target="_blank" rel="sponsored nofollow noopener">🏨 ${t('hotel')(r.st)} <span class="pr-badge">PR</span></a>`}`;
  if(!spinning) loadNearby(r.st[0]);
}

// ---------- 駅周辺スポット（OpenPOI API） ----------
const POI_API = 'https://api.openpoiapi.com/v1/search';
// ponytail: API にチェーン判定が無いので名前で推定。「ジョナサン 西馬込店」のような「ブランド名 + 支店名店」と
// 支店名なしで出てくる有名チェーンを除く。漏れが目立ったら CHAINS に足す。
const CHAINS = /マクドナルド|モスバーガー|ケンタッキー|吉野家|松屋|すき家|なか卯|ガスト|サイゼリヤ|ジョナサン|デニーズ|ロイヤルホスト|ココス|バーミヤン|ドトール|スターバックス|タリーズ|エクセルシオール|プロント|FLO |自遊空間|キオスク|コメダ|ベローチェ|サンマルク|ミスタードーナツ|ドミノ|ピザーラ|ピザハット|日高屋|幸楽苑|大戸屋|やよい軒|てんや|CoCo壱|ココイチ|丸亀|はなまる|富士そば|鳥貴族|磯丸|白木屋|和民|魚民|笑笑|くら寿司|スシロー|かっぱ寿司|はま寿司|リンガーハット|天下一品|一蘭|一風堂|ローソン|セブン|ファミリーマート/i;
const isChain = name => CHAINS.test(name) || /[\s　].*店([\s　]*[(（].*)?$/.test(name);
const PARKS = ['公園', '庭園'];
const SIGHTS = ['神社', '寺', '八幡', '稲荷', '美術館', '博物館', '記念館', '資料館'];
// 飲食の営業許可データには保育園の給食なども混じるので名前で落とす
const NOT_SPOT = /保育|事業所|会社|病院|クリニック|医院|歯科|学校|作業|施設|改札|窓口|出口|バス停|駐車|駐輪/;
const named = words => x => words.some(w=>x.name.includes(w));

async function poi(st, q){
  const [lat, lng] = COORDS[st];
  const u = `${POI_API}?center=${lng},${lat}&radius=800&limit=` + (q ? '30&q=' + encodeURIComponent(q) : 200);
  return (await (await fetch(u)).json()).results;
}
// ponytail: q にスペース区切りで複数語を渡すと 0 件になることがあるので 1 語ずつ投げる（1 回のガチャで約 10 リクエスト）
const poiWords = (st, words) => Promise.all(words.map(w=>poi(st, w))).then(r=>r.flat());
// 配列からランダムに n 件（名前の重複は除く）
function sample(list, n){
  const uniq = [...new Map(list.map(x=>[x.name, x])).values()];
  for(let i = uniq.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [uniq[i], uniq[j]] = [uniq[j], uniq[i]]; }
  return uniq.slice(0, n);
}

async function loadNearby(st){
  if(!COORDS[st]) return;
  const box = document.createElement('div');
  box.className = 'nearby';
  card.appendChild(box);
  let groups;
  try {
    // 都心は近い順 200 件がすぐ埋まるので、公園と観光はキーワードで別に引く
    const [all, parks, sights] = await Promise.all([poi(st), poiWords(st, PARKS), poiWords(st, SIGHTS)]);
    // q は住所にもヒットするので名前で絞り直す
    groups = [
      all.filter(x=>x.business_type === 'restaurant' && !isChain(x.name)),
      all.filter(x=>x.business_type === 'cafe' && !isChain(x.name)),
      parks.filter(x=>named(PARKS)(x) && !/店/.test(x.name)),
      sights.filter(x=>named(SIGHTS)(x) && !named(PARKS)(x) && !/店/.test(x.name))
    ].map(list=>list.filter(x=>!NOT_SPOT.test(x.name)));
  } catch(e){ box.remove(); return; }
  if(!box.isConnected) return; // 待っている間に次のガチャが回った
  groups.forEach((list, i)=>{
    const picks = sample(list, 3);
    if(!picks.length) return;
    const h = document.createElement('div');
    h.className = 'nearby-head';
    h.textContent = t('nearby')[i];
    box.appendChild(h);
    picks.forEach(x=>{
      const a = document.createElement('a');
      a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.name + ' ' + (x.address || x.lat + ',' + x.lng))}`;
      a.target = '_blank'; a.rel = 'noopener';
      a.textContent = x.name;
      box.appendChild(a);
    });
  });
  if(box.childElementCount) box.insertAdjacentHTML('beforeend', '<div class="nearby-src">Data: <a href="https://openpoiapi.com/attribution.html" target="_blank" rel="noopener">OpenPOI API</a></div>');
  else box.remove();
}

go.onclick = ()=>{
  go.disabled = true;
  shareEl.hidden = true;
  let n = 0;
  const total = 14;
  const timer = setInterval(()=>{
    render(pick(), true);
    if(++n >= total){
      clearInterval(timer);
      const final = pick();
      render(final, false);
      addHist(final);
      updateShare(final);
      go.disabled = false;
    }
  }, 70);
};

function addHist(r){
  history.unshift({ k: r.line.key, i: r.idx });
  if(history.length > HIST_MAX) history.pop();
  saveHist();
  renderHist();
}

// ---------- 言語適用 ----------
const langsEl = document.getElementById('langs');

langsEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
syncChips();
renderHist();

langsEl.addEventListener('click', e=>{
  const b = e.target.closest('button[data-lang]');
  if(!b || b.dataset.lang === lang) return;
  const next = b.dataset.lang;
  // 言語に対応するパスへ遷移（/ = ja, /en/ = en, /zh/ = zh。都市版は /osaka/ 等が続く）
  location.href = '/' + (next === 'ja' ? '' : next + '/') + CITY_PATH;
});


