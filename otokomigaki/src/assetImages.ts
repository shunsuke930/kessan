/**
 * ドット絵素材(src/assets/rooms, src/assets/chars)へのURL解決。
 * import.meta.glob はマッチするファイルが無くても空オブジェクトを返すだけで
 * ビルドが落ちないため、画像がまだ配置されていない状態でも安全に使える。
 */
const roomImages = import.meta.glob('./assets/rooms/room_*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const charImages = import.meta.glob('./assets/chars/char_*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

export function getRoomImageSrc(grade: number): string | null {
  const entry = Object.entries(roomImages).find(([path]) => path.endsWith(`/room_${grade}.png`))
  return entry ? entry[1] : null
}

/** Grade5専用の夜景きらめきレイヤー(room_5_flicker.png)。無ければnull */
export function getRoomFlickerImageSrc(grade: number): string | null {
  const entry = Object.entries(roomImages).find(([path]) => path.endsWith(`/room_${grade}_flicker.png`))
  return entry ? entry[1] : null
}

export function getCharImageSrc(stage: number): string | null {
  const entry = Object.entries(charImages).find(([path]) => path.endsWith(`/char_${stage}.png`))
  return entry ? entry[1] : null
}
