// 仙台版（仙台市地下鉄）の路線・駅データ。app.js より先に読み込む。
const CITY_PATH = 'sendai/';
// shortcut: ラインカラーは公式のカラーコード未確認の近似値（南北線=グリーン、東西線=スカイブルー）、公式値が分かれば差し替える
const LINES = [
  { key:"N", name:"南北線", color:"#00A040", op:"sendai", stations:[
    ["泉中央","Izumi-Chuo"],["八乙女","Yaotome"],["黒松","Kuromatsu"],["旭ヶ丘","Asahigaoka"],["台原","Dainohara"],["北仙台","Kita-Sendai"],["北四番丁","Kita-Yobancho"],["勾当台公園","Kotodai-Koen"],["広瀬通","Hirose-dori"],["仙台","Sendai"],["五橋","Itsutsubashi"],["愛宕橋","Atagobashi"],["河原町","Kawaramachi"],["長町一丁目","Nagamachi-Itchome"],["長町","Nagamachi"],["長町南","Nagamachi-Minami"],["富沢","Tomizawa"]
  ]},
  { key:"T", name:"東西線", color:"#00A0E3", op:"sendai", stations:[
    ["八木山動物公園","Yagiyama Zoological Park"],["青葉山","Aobayama"],["川内","Kawauchi"],["国際センター","International Center"],["大町西公園","Omachi Nishi-koen"],["青葉通一番町","Aoba-dori Ichibancho"],["仙台","Sendai"],["宮城野通","Miyagino-dori"],["連坊","Rembo"],["薬師堂","Yakushido"],["卸町","Oroshimachi"],["六丁の目","Rokuchonome"],["荒井","Arai"]
  ]}
];

const OPERATORS = [
  { key:'sendai', name:'仙台市地下鉄' }
];

const GUIDES = {
  "泉中央":["南北線の北の起点、ユアテックスタジアム仙台の最寄り。","Northern terminus of the Namboku Line, nearest station to Yurtec Stadium Sendai."],
  "八乙女":["泉区の住宅街、七北田川沿いの散歩道も。","A residential area in Izumi Ward with walking paths along the Nanakita River."],
  "黒松":["丘陵に広がる閑静な住宅地。","A quiet residential district spread across low hills."],
  "旭ヶ丘":["仙台市天文台のある台原森林公園に近い。","Near Dainohara Forest Park and the Sendai Astronomical Observatory area."],
  "台原":["緑豊かな台原森林公園の最寄り駅。","Gateway to the leafy Dainohara Forest Park."],
  "北仙台":["JR仙山線と接続、北山の寺社巡りの起点に。","Connects with the JR Senzan Line, a starting point for the temples of Kitayama."],
  "北四番丁":["官庁街の北、晩翠草堂など文学ゆかりの地も。","North of the government district, near the literary site Bansui Sodo."],
  "勾当台公園":["市役所と県庁が並ぶ仙台の中心、定禅寺通も近い。","The civic heart of Sendai beside City Hall, close to Jozenji-dori."],
  "広瀬通":["一番町アーケードと飲食店が集まる繁華街。","A busy downtown stop by the Ichibancho arcades and restaurants."],
  "仙台":["新幹線と在来線が集まる東北最大のターミナル。","The largest terminal in Tohoku, where the Shinkansen meets local lines."],
  "五橋":["東北学院大学のキャンパスがある文教エリア。","A college district home to a Tohoku Gakuin University campus."],
  "愛宕橋":["広瀬川を見下ろす愛宕神社への入口。","Gateway to Atago Shrine overlooking the Hirose River."],
  "河原町":["広瀬川近く、昔ながらの商店が残る下町。","An old-town neighborhood near the Hirose River with long-running shops."],
  "長町一丁目":["太白区の住宅と商店が混じる落ち着いた街。","A calm mix of homes and shops in Taihaku Ward."],
  "長町":["JR長町駅と接続、再開発で新しい店が増えた街。","Connects with JR Nagamachi, a redeveloped area with plenty of new shops."],
  "長町南":["ザ・モールなど大型商業施設が集まる。","A shopping hub with large malls such as The Mall Sendai Nagamachi."],
  "富沢":["南北線の南の終点、富沢遺跡保存館（地底の森ミュージアム）が近い。","Southern terminus of the Namboku Line, near the Underground Forest Museum."],
  "八木山動物公園":["東西線の西の終点、八木山動物公園とベニーランドへ。","Western terminus of the Tozai Line, for Yagiyama Zoo and Benny Land."],
  "青葉山":["東北大学青葉山キャンパスの最寄り、緑に囲まれた駅。","A forest-ringed station serving Tohoku University's Aobayama campus."],
  "川内":["東北大学川内キャンパスと仙台城跡への入口。","Gateway to Tohoku University's Kawauchi campus and the Sendai Castle ruins."],
  "国際センター":["仙台国際センターと仙台市博物館、仙台城跡へも歩ける。","By the Sendai International Center and City Museum, within walking distance of the castle ruins."],
  "大町西公園":["広瀬川沿いの西公園、桜の名所として知られる。","Next to Nishi Park on the Hirose River, a well-known cherry blossom spot."],
  "青葉通一番町":["一番町アーケードとケヤキ並木の青葉通。","Zelkova-lined Aoba-dori and the Ichibancho shopping arcades."],
  "宮城野通":["仙台駅東口、楽天モバイルパーク宮城へ歩ける。","Sendai Station's east side, a walk from Rakuten Mobile Park Miyagi."],
  "連坊":["若林区の落ち着いた住宅街と商店。","Quiet homes and local shops in Wakabayashi Ward."],
  "薬師堂":["陸奥国分寺跡の薬師堂、毎月の手づくり市も。","Home to the Yakushido hall on the Mutsu Kokubunji temple site and its monthly craft fair."],
  "卸町":["問屋街から生まれ変わった倉庫とイベントの街。","A former wholesale district reborn with warehouses and events."],
  "六丁の目":["幹線道路沿いに大型店が並ぶ郊外の街。","A suburban area with large stores along the main roads."],
  "荒井":["東西線の東の終点、せんだい3.11メモリアル交流館がある。","Eastern terminus of the Tozai Line, home to the Sendai 3.11 Memorial Community Center."]
};

const LINE_I18N = {
  N: { en: 'Namboku Line', zh: '南北线' },
  T: { en: 'Tozai Line',   zh: '东西线' }
};
const OP_I18N = {
  sendai: { en: 'Sendai City Subway', zh: '仙台市地铁' }
};

// 駅の座標 [緯度, 経度]（周辺スポット検索用。HeartRails Express API から取得）
const COORDS = {"泉中央":[38.323167,140.880796],"八乙女":[38.312899,140.884037],"黒松":[38.303142,140.886285],"旭ヶ丘":[38.295593,140.883633],"台原":[38.288524,140.878512],"北仙台":[38.28245,140.868899],"北四番丁":[38.272137,140.86907],"勾当台公園":[38.266304,140.871292],"広瀬通":[38.262971,140.875736],"仙台":[38.259901,140.879928],"五橋":[38.251861,140.881014],"愛宕橋":[38.24729,140.882036],"河原町":[38.241112,140.887702],"長町一丁目":[38.234085,140.887402],"長町":[38.228244,140.884842],"長町南":[38.224642,140.87657],"富沢":[38.214087,140.87046],"八木山動物公園":[38.242778,140.843472],"青葉山":[38.254972,140.835222],"川内":[38.260556,140.85],"国際センター":[38.260167,140.856944],"大町西公園":[38.258889,140.864167],"青葉通一番町":[38.259722,140.872222],"宮城野通":[38.258333,140.885833],"連坊":[38.251111,140.893056],"薬師堂":[38.249583,140.906111],"卸町":[38.251528,140.920833],"六丁の目":[38.250972,140.935556],"荒井":[38.244861,140.948611]};
