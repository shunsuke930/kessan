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
