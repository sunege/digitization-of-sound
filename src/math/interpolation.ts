/**
 * アニメーション用の補間ヘルパ。
 */

/**
 * 線形補間（linear interpolation）。
 * t=0 で a、t=1 で b を返す（要件§16.3 量子化アニメーションで使用）。
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** t を [0, 1] に収める。 */
export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/**
 * イージング（ease-out cubic）。
 * 終端で滑らかに止まる動き。吸着アニメーションを自然に見せる。
 */
export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - (1 - c) ** 3;
}
