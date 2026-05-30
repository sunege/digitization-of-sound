/**
 * 量子化の数学処理。
 *
 * 振幅（連続値）を段階的な値（離散レベル）へ丸める（要件§15）。
 * 量子化レベル数 = 2 ^ bitDepth。
 */

/** 量子化結果（1サンプル分）。 */
export interface QuantizedValue {
  /** 量子化レベルのインデックス（0 〜 levels-1）。符号化で2進数化する対象。 */
  levelIndex: number;
  /** 量子化後の振幅 [-1..1]（レベルを実際の振幅へ戻した値）。 */
  amplitude: number;
  /** 量子化誤差 = 元の振幅 - 量子化後の振幅。 */
  error: number;
}

/** bitDepth に対応する量子化レベル数（= 2^bitDepth）を返す。 */
export function quantizationLevels(bitDepth: number): number {
  return 2 ** bitDepth;
}

/**
 * 1つの振幅値を量子化する。
 *
 * 手順:
 *   1. 値域 [-1, 1] を [0, 1] へ正規化する。
 *   2. レベル数 L = 2^bitDepth で等分し、最も近いレベルへ丸める。
 *   3. レベルを振幅 [-1, 1] へ戻す。
 *
 * @param value    元の振幅 [-1..1]
 * @param bitDepth 量子化ビット数（1〜16）
 */
export function quantize(value: number, bitDepth: number): QuantizedValue {
  const levels = quantizationLevels(bitDepth);

  // [-1, 1] → [0, 1] へ正規化（範囲外は丸め込む）。
  const normalized = Math.min(1, Math.max(0, (value + 1) / 2));

  // 0 〜 (levels-1) の最も近いレベルへ丸める。
  const levelIndex = Math.round(normalized * (levels - 1));

  // レベル → [0,1] → [-1,1] へ復元。
  const restoredNormalized = levels > 1 ? levelIndex / (levels - 1) : 0.5;
  const amplitude = restoredNormalized * 2 - 1;

  return {
    levelIndex,
    amplitude,
    error: value - amplitude,
  };
}

/** 振幅配列をまとめて量子化する。 */
export function quantizeAll(values: number[], bitDepth: number): QuantizedValue[] {
  return values.map((v) => quantize(v, bitDepth));
}
