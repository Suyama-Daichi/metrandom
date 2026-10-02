// 名古屋版（名古屋市営地下鉄）の路線・駅データ。app.js より先に読み込む。
const CITY_PATH = 'nagoya/';
const LINES = [
  { key:"H", name:"東山線", color:"#FAB123", op:"nagoya", stations:[
    ["高畑","Takabata"],["八田","Hatta"],["岩塚","Iwatsuka"],["中村公園","Nakamura Koen"],["中村日赤","Nakamura Nisseki"],["本陣","Honjin"],["亀島","Kamejima"],["名古屋","Nagoya"],["伏見","Fushimi"],["栄","Sakae"],["新栄町","Shinsakae-machi"],["千種","Chikusa"],["今池","Imaike"],["池下","Ikeshita"],["覚王山","Kakuozan"],["本山","Motoyama"],["東山公園","Higashiyama Koen"],["星ヶ丘","Hoshigaoka"],["一社","Issha"],["上社","Kamiyashiro"],["本郷","Hongo"],["藤が丘","Fujigaoka"]
  ]},
  { key:"M", name:"名城線", color:"#B074D6", op:"nagoya", stations:[
    ["金山","Kanayama"],["東別院","Higashi Betsuin"],["上前津","Kamimaezu"],["矢場町","Yabacho"],["栄","Sakae"],["久屋大通","Hisaya-odori"],["名古屋城","Nagoyajo"],["名城公園","Meijo Koen"],["黒川","Kurokawa"],["志賀本通","Shiga-hondori"],["平安通","Heian-dori"],["大曽根","Ozone"],["ナゴヤドーム前矢田","Nagoya Dome-mae Yada"],["砂田橋","Sunadabashi"],["茶屋ヶ坂","Chayagasaka"],["自由ヶ丘","Jiyugaoka"],["本山","Motoyama"],["名古屋大学","Nagoya Daigaku"],["八事日赤","Yagoto Nisseki"],["八事","Yagoto"],["総合リハビリセンター","Sogo Rehabilitation Center"],["瑞穂運動場東","Mizuho Undojo Higashi"],["新瑞橋","Aratamabashi"],["妙音通","Myoon-dori"],["堀田","Horita"],["熱田神宮伝馬町","Atsuta Jingu Temmacho"],["熱田神宮西","Atsuta Jingu Nishi"],["西高蔵","Nishi Takakura"]
  ]},
  { key:"E", name:"名港線", color:"#B074D6", op:"nagoya", stations:[
    ["金山","Kanayama"],["日比野","Hibino"],["六番町","Rokubancho"],["東海通","Tokai-dori"],["港区役所","Minato Kuyakusho"],["築地口","Tsukijiguchi"],["名古屋港","Nagoyako"]
  ]},
  { key:"T", name:"鶴舞線", color:"#009BBF", op:"nagoya", stations:[
    ["上小田井","Kami Otai"],["庄内緑地公園","Shonai Ryokuchi Koen"],["庄内通","Shonai-dori"],["浄心","Joshin"],["浅間町","Sengencho"],["丸の内","Marunouchi"],["伏見","Fushimi"],["大須観音","Osu Kannon"],["上前津","Kamimaezu"],["鶴舞","Tsurumai"],["荒畑","Arahata"],["御器所","Gokiso"],["川名","Kawana"],["いりなか","Irinaka"],["八事","Yagoto"],["塩釜口","Shiogamaguchi"],["植田","Ueda"],["原","Hara"],["平針","Hirabari"],["赤池","Akaike"]
  ]},
  { key:"S", name:"桜通線", color:"#C92F44", op:"nagoya", stations:[
    ["太閤通","Taiko-dori"],["名古屋","Nagoya"],["国際センター","Kokusai Center"],["丸の内","Marunouchi"],["久屋大通","Hisaya-odori"],["高岳","Takaoka"],["車道","Kurumamichi"],["今池","Imaike"],["吹上","Fukiage"],["御器所","Gokiso"],["桜山","Sakurayama"],["瑞穂区役所","Mizuho Kuyakusho"],["瑞穂運動場西","Mizuho Undojo Nishi"],["新瑞橋","Aratamabashi"],["桜本町","Sakura-hommachi"],["鶴里","Tsurusato"],["野並","Nonami"],["鳴子北","Narukokita"],["相生山","Aioiyama"],["神沢","Kamisawa"],["徳重","Tokushige"]
  ]},
  { key:"K", name:"上飯田線", color:"#EC78B4", op:"nagoya", stations:[
    ["上飯田","Kamiiida"],["平安通","Heian-dori"]
  ]}
];

const OPERATORS = [
  { key:'nagoya', name:'名古屋市営地下鉄' }
];

const GUIDES = {
  "高畑":["東山線の西の起点、中川区の落ち着いた住宅街。","Western terminus of the Higashiyama Line, a quiet residential area in Nakagawa Ward."],
  "八田":["JR・近鉄と乗り換えできる中川区の交通拠点。","A Nakagawa Ward transit hub with transfers to JR and Kintetsu lines."],
  "岩塚":["庄内川の近く、昔ながらの商店が残る下町。","An old-fashioned neighborhood near the Shonai River with long-running local shops."],
  "中村公園":["豊臣秀吉生誕の地、豊国神社と大鳥居が目印。","Birthplace of Toyotomi Hideyoshi, marked by Hokoku Shrine and a giant torii gate."],
  "中村日赤":["日赤病院がある、商店街の残る庶民的な街。","A down-to-earth area with a Red Cross hospital and old shopping streets."],
  "本陣":["かつての遊郭の面影を残す建物が点在する街。","Scattered buildings still hint at the area's former pleasure-quarter past."],
  "亀島":["名古屋駅の西隣、ノリタケの森へも歩ける。","Just west of Nagoya Station, within walking distance of the Noritake Garden."],
  "名古屋":["JRセントラルタワーズと地下街、名古屋の玄関口。","Nagoya's gateway, with the JR Central Towers and sprawling underground malls."],
  "伏見":["オフィス街と名古屋市科学館の巨大プラネタリウム。","Office towers and the giant planetarium dome of the Nagoya City Science Museum."],
  "栄":["オアシス21とテレビ塔、名古屋随一の繁華街。","Oasis 21 and the old TV Tower in Nagoya's busiest shopping district."],
  "新栄町":["栄の東、オフィスと飲食店が並ぶ落ち着いた街。","East of Sakae, a calmer mix of offices and restaurants."],
  "千種":["JR中央線と接続、予備校や学生街の雰囲気も。","Connects with the JR Chuo Line, with a student-town feel from its prep schools."],
  "今池":["ライブハウスと飲み屋が集まる名古屋のサブカル街。","Nagoya's subculture hub of live music venues and late-night bars."],
  "池下":["古川美術館もある、閑静な住宅と商店の街。","A quiet residential area with shops and the Furukawa Art Museum."],
  "覚王山":["日泰寺の参道に雑貨店とカフェが並ぶ。","Boutiques and cafes line the approach to Nittai-ji Temple."],
  "本山":["名古屋大学に近い、おしゃれな飲食店の多い学生街。","A student town near Nagoya University packed with stylish eateries."],
  "東山公園":["東山動植物園と東山スカイタワーの最寄り駅。","Gateway to Higashiyama Zoo & Botanical Gardens and the Sky Tower."],
  "星ヶ丘":["星ヶ丘テラスでショッピング、女子大も集まる。","Shopping at Hoshigaoka Terrace, surrounded by university campuses."],
  "一社":["飲食店が並ぶ名東区の便利な住宅街。","A convenient residential area in Meito Ward lined with restaurants."],
  "上社":["名古屋ICに近い、大型店が集まる郊外の街。","A suburban area near the Nagoya Interchange with large stores."],
  "本郷":["藤が丘の手前、静かな住宅街。","A quiet residential stop just before Fujigaoka."],
  "藤が丘":["東山線の終点、リニモに乗り換えてジブリパークへ。","Higashiyama Line terminus — transfer to the Linimo maglev for Ghibli Park."],
  "金山":["JR・名鉄が集まる総合駅、アスナル金山も。","A major JR and Meitetsu interchange with the Asunal Kanayama mall."],
  "東別院":["真宗大谷派の名古屋別院、毎月の手づくり市も。","Home to the Higashi Betsuin temple and its monthly handicraft market."],
  "上前津":["大須商店街の東の入口、古着とグルメの街。","Eastern entrance to the Osu shopping streets, full of vintage clothes and street food."],
  "矢場町":["矢場とんの味噌カツとパルコ、栄の南端。","Yabaton miso-katsu and PARCO at the southern edge of Sakae."],
  "久屋大通":["Hisaya-odori Parkとテレビ塔が並ぶ都心の公園。","Downtown green space along Hisaya-odori Park and the TV Tower."],
  "名古屋城":["金のしゃちほこが輝く名古屋城の最寄り駅。","The nearest station to Nagoya Castle and its golden shachihoko."],
  "名城公園":["名城公園の緑と、tonarinoのカフェが楽しめる。","Leafy Meijo Park and the cafés of the tonarino complex."],
  "黒川":["堀川沿いの桜並木が美しい住宅地。","A residential area with beautiful cherry trees along the Horikawa canal."],
  "志賀本通":["北区の生活道路沿い、地元密着の商店が並ぶ。","Local shops line the main street of this Kita Ward neighborhood."],
  "平安通":["名城線と上飯田線が出合う乗換駅。","Where the Meijo and Kamiiida lines meet."],
  "大曽根":["JR・名鉄・ゆとりーとラインが集まる交通の要所。","A key hub for JR, Meitetsu and the Yutorito Line guideway bus."],
  "ナゴヤドーム前矢田":["中日ドラゴンズの本拠地バンテリンドームの最寄り。","Nearest station to Vantelin Dome, home of the Chunichi Dragons."],
  "砂田橋":["矢田川近く、住宅とマンションが広がる街。","Residential blocks and apartments near the Yada River."],
  "茶屋ヶ坂":["坂道と公園が多い閑静な住宅地。","A quiet residential district of hills and parks."],
  "自由ヶ丘":["丘の上に広がる千種区の住宅街。","A hilltop residential area in Chikusa Ward."],
  "名古屋大学":["駅の真上が名大キャンパス、豊田講堂も。","Nagoya University campus sits right above, including Toyoda Auditorium."],
  "八事日赤":["八事日赤病院と緑の多い坂の街。","Home to Yagoto Red Cross Hospital in a green, hilly area."],
  "八事":["八事山興正寺の五重塔が建つ文教エリア。","A college district home to Koshoji Temple's five-storied pagoda."],
  "総合リハビリセンター":["瑞穂区の静かな住宅地にあるリハビリ施設の最寄り。","Serves a rehabilitation center in a quiet part of Mizuho Ward."],
  "瑞穂運動場東":["パロマ瑞穂スタジアムなど運動公園の東側。","East side of Mizuho Park, home to Paloma Mizuho Stadium."],
  "新瑞橋":["名城線と桜通線の乗換駅、イオンもある。","Transfer between the Meijo and Sakura-dori lines, with an AEON mall."],
  "妙音通":["山崎川に近い落ち着いた住宅街。","A calm residential area near the Yamazaki River."],
  "堀田":["名鉄堀田駅と接続、熱田方面への入口。","Connects with Meitetsu Horita, a gateway toward Atsuta."],
  "熱田神宮伝馬町":["熱田神宮の東側、宮の渡しにも近い旧宿場町。","Old post town on the shrine's east side, near the Miya-no-Watashi ferry site."],
  "熱田神宮西":["熱田神宮の西門すぐ、ひつまぶしの名店も。","Right by Atsuta Shrine's west gate, near famous hitsumabushi eel restaurants."],
  "西高蔵":["高座結御子神社がある、熱田区の住宅地。","A residential area in Atsuta Ward home to Takakura-musubimiko Shrine."],
  "日比野":["名古屋国際会議場と白鳥公園に近い。","Near the Nagoya Congress Center and Shirotori Garden."],
  "六番町":["工場と住宅が混じる、熱田区の港寄りの街。","A port-side mix of factories and homes in Atsuta Ward."],
  "東海通":["港区の生活道路沿いに商店が続く下町。","An old-town shopping strip along Tokai-dori in Minato Ward."],
  "港区役所":["区役所や公園が集まる港区の中心。","The civic heart of Minato Ward, with the ward office and parks."],
  "築地口":["名古屋港に近い、港町の雰囲気が残る街。","A neighborhood near the port that keeps its harbor-town feel."],
  "名古屋港":["名古屋港水族館とガーデンふ頭の最寄り駅。","Gateway to the Port of Nagoya Public Aquarium and Garden Pier."],
  "上小田井":["名鉄犬山線と接続、mozoワンダーシティが近い。","Connects with the Meitetsu Inuyama Line, near the mozo wonder city mall."],
  "庄内緑地公園":["四季の花が楽しめる広い庄内緑地の最寄り。","Gateway to the vast Shonai Ryokuchi Park and its seasonal flowers."],
  "庄内通":["西区の住宅街、商店街が続く生活の街。","A residential part of Nishi Ward with a long local shopping street."],
  "浄心":["交差点を中心に商店が集まる西区の拠点。","A Nishi Ward hub with shops clustered around its busy crossroads."],
  "浅間町":["円頓寺商店街や四間道の古い町並みへ歩ける。","Walk to the Endoji arcade and the old Shikemichi merchant streets."],
  "丸の内":["名古屋城の南、官庁とオフィスが集まる街。","Government and office district just south of Nagoya Castle."],
  "大須観音":["大須観音の門前に古着屋と食べ歩きの商店街。","Osu Kannon Temple and its shopping streets of vintage shops and street food."],
  "鶴舞":["鶴舞公園の噴水塔と奏楽堂、桜の名所。","Tsuruma Park's fountain and bandstand, a famed cherry blossom spot."],
  "荒畑":["名大病院の南、静かな住宅地。","A quiet residential area south of Nagoya University Hospital."],
  "御器所":["鶴舞線と桜通線の乗換駅、昭和区の中心。","Heart of Showa Ward, linking the Tsurumai and Sakura-dori lines."],
  "川名":["川名公園がある緑豊かな住宅街。","A leafy residential area with Kawana Park."],
  "いりなか":["南山大学に近い、学生でにぎわう街。","A lively student area near Nanzan University."],
  "塩釜口":["名城大学の最寄り、坂の多い学生街。","Hilly student town by Meijo University."],
  "植田":["天白川沿いの暮らしやすい住宅地。","A comfortable residential area along the Tempaku River."],
  "原":["天白区の商店や飲食店が集まる住宅街。","A Tempaku Ward residential area with shops and restaurants."],
  "平針":["運転免許試験場の最寄りとして有名な駅。","Famous as the nearest station to Aichi's driver's license center."],
  "赤池":["鶴舞線の終点、名鉄豊田線と直通する日進市の駅。","Tsurumai Line terminus in Nisshin, running through onto the Meitetsu Toyota Line."],
  "太閤通":["中村区の入口、名古屋駅西側の下町。","Gateway to Nakamura Ward on the old-town west side of Nagoya Station."],
  "国際センター":["名古屋国際センターと高層ビル、名駅から一駅。","One stop from Nagoya Station, by the Nagoya International Center towers."],
  "高岳":["東区の官庁街、文化のみちの洋館群へも近い。","East Ward civic area near the Western-style houses of the Cultural Path."],
  "車道":["東区と千種区の境、落ち着いたマンション街。","A calm apartment district on the East–Chikusa ward border."],
  "吹上":["名古屋市中小企業振興会館（吹上ホール）の最寄り。","Nearest station to Fukiage Hall exhibition center."],
  "桜山":["名市大病院がある、昭和区の便利な街。","A convenient Showa Ward hub with Nagoya City University Hospital."],
  "瑞穂区役所":["山崎川の桜並木が近い住宅街。","Residential area near the cherry-lined Yamazaki River."],
  "瑞穂運動場西":["パロマ瑞穂スタジアムの西側、山崎川の桜も。","West side of Paloma Mizuho Stadium, near the Yamazaki River cherries."],
  "桜本町":["南区の静かな住宅街。","A quiet residential district in Minami Ward."],
  "鶴里":["笠寺観音に近い、南区の住宅地。","A Minami Ward residential area near Kasadera Kannon temple."],
  "野並":["天白川沿い、交通量の多い交差点の街。","A busy crossroads town along the Tempaku River."],
  "鳴子北":["丘陵に団地が広がる緑区の住宅地。","Hillside housing estates in Midori Ward."],
  "相生山":["ヒメボタルで知られる相生山緑地が近い。","Near Aioiyama Green Space, known for its tiny fireflies."],
  "神沢":["緑区の新しい住宅街と商業施設。","Newer residential streets and shops in Midori Ward."],
  "徳重":["桜通線の終点、ヒルズウォーク徳重ガーデンズがある。","Sakura-dori Line terminus with the Hills Walk Tokushige Gardens mall."],
  "上飯田":["上飯田線の起点、名鉄小牧線と直通運転。","Start of the Kamiiida Line, running through onto the Meitetsu Komaki Line."]
};

const LINE_I18N = {
  H: { en: 'Higashiyama Line', zh: '东山线' },
  M: { en: 'Meijo Line',       zh: '名城线' },
  E: { en: 'Meiko Line',       zh: '名港线' },
  T: { en: 'Tsurumai Line',    zh: '鹤舞线' },
  S: { en: 'Sakura-dori Line', zh: '樱通线' },
  K: { en: 'Kamiiida Line',    zh: '上饭田线' }
};
const OP_I18N = {
  nagoya: { en: 'Transportation Bureau City of Nagoya', zh: '名古屋市营地铁' }
};
