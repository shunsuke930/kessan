/**
 * ドット絵素材(src/assets/rooms, src/assets/chars)への遅延URL解決。
 * eager指定なし(=遅延)のimport.meta.globなので、実際に必要になった画像だけを
 * 動的import・取得する。マッチするファイルが無くても空オブジェクトを返す
 * だけでビルドは落ちないため、画像がまだ配置されていない状態でも安全に使える。
 */
const roomImageLoaders = import.meta.glob('./assets/rooms/room_*.png', {
  import: 'default',
  query: '?url',
}) as Record<string, () => Promise<string>>

const charImageLoaders = import.meta.glob('./assets/chars/char_*.png', {
  import: 'default',
  query: '?url',
}) as Record<string, () => Promise<string>>

function findLoader(
  loaders: Record<string, () => Promise<string>>,
  suffix: string,
): (() => Promise<string>) | null {
  const entry = Object.entries(loaders).find(([path]) => path.endsWith(suffix))
  return entry ? entry[1] : null
}

export function loadRoomImage(grade: number): Promise<string | null> {
  const loader = findLoader(roomImageLoaders, `/room_${grade}.png`)
  return loader ? loader() : Promise.resolve(null)
}

/** Grade5専用の夜景きらめきレイヤー(room_5_flicker.png)。無ければnull */
export function loadRoomFlickerImage(grade: number): Promise<string | null> {
  const loader = findLoader(roomImageLoaders, `/room_${grade}_flicker.png`)
  return loader ? loader() : Promise.resolve(null)
}

export function loadCharImage(stage: number): Promise<string | null> {
  const loader = findLoader(charImageLoaders, `/char_${stage}.png`)
  return loader ? loader() : Promise.resolve(null)
}
