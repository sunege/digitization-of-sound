/**
 * データサイズ計算（要件§10.3）。
 *
 *   DataSize [bit] = sampleRate × bitDepth × channels × duration
 *
 * これを Byte / KB / MB に整形して表示に使う。
 */

export interface DataSizeInput {
  sampleRate: number; // [Hz]
  bitDepth: number; // [bit]
  channels: number; // モノラルなら 1
  duration: number; // [秒]
}

/** 総ビット数を返す。 */
export function dataSizeBits(input: DataSizeInput): number {
  const { sampleRate, bitDepth, channels, duration } = input;
  return sampleRate * bitDepth * channels * duration;
}

/** 総バイト数を返す（8bit = 1Byte）。 */
export function dataSizeBytes(input: DataSizeInput): number {
  return dataSizeBits(input) / 8;
}
