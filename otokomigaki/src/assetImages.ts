/**
 * ドット絵素材は public/assets/ 配下にルート絶対パスで置く方式に統一している
 * （src/配下でimportする方式は、ビルド後のハッシュ付きファイル名やコード分割の
 * 経路がホスティング側の設定と噛み合わず、本番で読み込めなくなる問題があった）。
 * パスは文字列を組み立てず、すべて明示的なマップとして持つ。
 * ここに無いグレード/段階は単に「画像なし」として扱われ、呼び出し側は
 * 絵文字などのフォールバック表示に切り替える。ファイルが実在しない場合も
 * ビルドは落ちない（public/はビルド時に存在チェックされないため）。
 */

export const ROOM_IMAGES: Record<number, string> = {
  1: '/assets/rooms/room_1.png',
  2: '/assets/rooms/room_2.png',
  3: '/assets/rooms/room_3.png',
  4: '/assets/rooms/room_4.png',
  5: '/assets/rooms/room_5.png',
  6: '/assets/rooms/room_6.png',
}

/** Grade5(海の見える家)専用の波アニメーション用フレーム */
export const ROOM_WAVE_IMAGES: Record<number, string[]> = {
  5: [
    '/assets/rooms/room_5_wave_1.png',
    '/assets/rooms/room_5_wave_2.png',
    '/assets/rooms/room_5_wave_3.png',
  ],
}

/** Grade6(タワーマンション)専用の夜景きらめきレイヤー */
export const ROOM_FLICKER_IMAGES: Record<number, string> = {
  6: '/assets/rooms/room_6_flicker.png',
}

export const CHAR_IMAGES: Record<number, string> = {
  1: '/assets/chars/char_1.png',
  2: '/assets/chars/char_2.png',
  3: '/assets/chars/char_3.png',
  4: '/assets/chars/char_4.png',
  5: '/assets/chars/char_5.png',
}

export function getRoomImageSrc(grade: number): string | null {
  return ROOM_IMAGES[grade] ?? null
}

export function getRoomWaveImages(grade: number): string[] | null {
  return ROOM_WAVE_IMAGES[grade] ?? null
}

export function getRoomFlickerImageSrc(grade: number): string | null {
  return ROOM_FLICKER_IMAGES[grade] ?? null
}

export function getCharImageSrc(stage: number): string | null {
  return CHAR_IMAGES[stage] ?? null
}
