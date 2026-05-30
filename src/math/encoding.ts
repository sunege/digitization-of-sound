/**
 * 符号化の数学処理。
 *
 * 量子化レベルのインデックス（整数）を、ビット数ぶんの2進数文字列へ変換する。
 * 例: levelIndex=3, bitDepth=4 → "0011"（要件§10.2）。
 */

/**
 * 整数を bitDepth 桁の2進数文字列へ変換する（上位ゼロ埋め）。
 *
 * @param levelIndex 量子化レベルのインデックス（0以上の整数）
 * @param bitDepth   ビット数（出力の桁数）
 */
export function toBinary(levelIndex: number, bitDepth: number): string {
  // 安全のため非負整数へ丸める。
  const safe = Math.max(0, Math.floor(levelIndex));
  // 2進数化し、足りない上位桁を '0' で埋める。
  return safe.toString(2).padStart(bitDepth, '0').slice(-bitDepth);
}
