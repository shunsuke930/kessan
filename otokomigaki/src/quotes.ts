export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  { text: 'なせば成る、なさねば成らぬ何事も', author: '上杉鷹山' },
  { text: '小を積みて大と為す', author: '二宮尊徳' },
  { text: '天は自ら助くる者を助く', author: 'サミュエル・スマイルズ' },
  { text: '千里の道も一歩から', author: '老子' },
  { text: '汝自身を知れ', author: 'ソクラテス' },
  { text: '我々の繰り返す行動が、我々自身をつくる', author: 'アリストテレス' },
  { text: '過ちて改めざる、これを過ちという', author: '孔子' },
  { text: '夢なき者に理想なし、理想なき者に計画なし', author: '吉田松陰' },
  { text: '人の一生は重荷を負うて遠き道を行くが如し', author: '徳川家康' },
  { text: '我、事において後悔せず', author: '宮本武蔵' },
  { text: '天は人の上に人を造らず', author: '福沢諭吉' },
  { text: '失敗したところでやめてしまうから失敗になる', author: '松下幸之助' },
  { text: '成功とは、99%の失敗に支えられた1%だ', author: '本田宗一郎' },
  { text: '天才とは1%のひらめきと99%の努力である', author: 'エジソン' },
  { text: '困難だから始めないのではない。始めないから困難なのだ', author: 'セネカ' },
  { text: '時間を無駄にするな。人生は時間でできている', author: 'フランクリン' },
  { text: '脱皮できない蛇は滅びる', author: 'ニーチェ' },
  { text: '人生の幸福は、思考の質による', author: 'マルクス・アウレリウス' },
  { text: '万物は流転する', author: 'ヘラクレイトス' },
  { text: '今日始めなかったことは、明日終わることもない', author: 'ゲーテ' },
  { text: '己に勝つことが最大の勝利である', author: 'プラトン' },
  { text: '習慣は第二の天性なり', author: 'キケロ' },
  { text: '知は力なり', author: 'フランシス・ベーコン' },
  { text: '彼を知り己を知れば百戦殆うからず', author: '孫子' },
  { text: '勝つ者は先に勝ってから戦う', author: '孫子' },
  { text: '天下の大事は必ず細より作る', author: '老子' },
  { text: '足るを知る者は富む', author: '老子' },
  { text: '他人を知る者は智なり、自らを知る者は明なり', author: '老子' },
  { text: '学びて思わざれば則ち罔し', author: '孔子' },
  { text: '己の欲せざる所は人に施すこと勿れ', author: '孔子' },
  { text: '最大の栄光は倒れるたびに起き上がることにある', author: '孔子' },
  { text: '至誠にして動かざる者は未だ之あらざるなり', author: '孟子' },
  { text: '一日作さざれば一日食らわず', author: '百丈懐海' },
  { text: '初心忘るべからず', author: '世阿弥' },
  { text: '精神一到何事か成らざらん', author: '朱熹' },
  { text: '一寸の光陰軽んずべからず', author: '朱熹' },
  { text: '男子三日会わざれば刮目して見よ', author: '呂蒙' },
  { text: '及ばざるは過ぎたるより勝れり', author: '徳川家康' },
  { text: '鳴かぬなら鳴くまで待とう時鳥', author: '徳川家康' },
  { text: '志を立てるのに、老いも若きもない', author: '吉田松陰' },
  { text: '意志あるところに道は開ける', author: 'リンカーン' },
  { text: '木を切る時間が六時間あれば、四時間は斧を研ぐ', author: 'リンカーン' },
  { text: '私は失敗していない。うまくいかない方法を見つけただけだ', author: 'エジソン' },
  { text: '困難の中に、機会がある', author: 'アインシュタイン' },
  { text: '大切なのは、問い続けることをやめないことだ', author: 'アインシュタイン' },
  { text: '人生は自転車と同じだ。倒れないためには走り続けること', author: 'アインシュタイン' },
  { text: '決して屈するな。決して、決して、決して', author: 'チャーチル' },
  { text: '悲観主義者はあらゆる好機の中に困難を見出す', author: 'チャーチル' },
  { text: '幸運は、準備された心にのみ宿る', author: 'パスツール' },
  { text: 'なしうると信じる者が、なしうるのだ', author: 'ウェルギリウス' },
  { text: '人生は短いのではない。我々が浪費しているのだ', author: 'セネカ' },
  { text: '怒りは、それを注ぐ器そのものを損なう', author: 'セネカ' },
  { text: '人間は考える葦である', author: 'パスカル' },
  { text: '賢者は歴史に学び、愚者は経験に学ぶ', author: 'ビスマルク' },
  { text: '早寝早起きは、人を健康にし、賢明にする', author: 'フランクリン' },
  { text: '明日死ぬかのように生きよ。永遠に生きるかのように学べ', author: 'ガンジー' },
  { text: '毎日、自分にできないと思う何かに挑戦しなさい', author: 'エレノア・ルーズベルト' },
  { text: '他人より優れていることは高貴ではない。以前の自分より優れていることが真に高貴である', author: 'ヘミングウェイ' },
  { text: '行動が常に幸福をもたらすとは限らないが、行動なくして幸福はない', author: 'ディズレーリ' },
  { text: '継続は力なり', author: '住岡夜晃' },
]

/** ランダムに1つ選ぶ。excludeを渡すと同じ名言が連続しないようにする */
export function pickRandomQuote(exclude?: Quote): Quote {
  if (QUOTES.length <= 1) return QUOTES[0]

  let next = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  while (next === exclude) {
    next = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  }
  return next
}
