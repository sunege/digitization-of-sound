/**
 * サンプリング（標本化）の数学処理。
 *
 * 教育用途のため「単純間引き方式」を採用する（要件§14）。
 * 高品質リサンプリング（ローパスフィルタ等）は行わない。
 */
import type { AudioSignal } from '../types/audio';

/** 1つのサンプリング点。 */
export interface SamplePoint {
  /** 測定した時刻 [秒]。 */
  timeSec: number;
  /** その時刻の振幅 [-1..1]。 */
  amplitude: number;
  /** 元データ配列上のインデックス。 */
  sourceIndex: number;
}

/**
 * 元信号を targetRate [Hz] でサンプリング（単純間引き）する。
 *
 * 考え方:
 *   元信号は baseRate [Hz] で並んだサンプル列。
 *   サンプリング周期 = 1 / targetRate [秒]。
 *   一定の時間間隔ごとに最も近い元サンプルを「測定値」として拾う。
 *
 * @param signal     元信号（baseRate のデジタルデータ）
 * @param targetRate サンプリング周波数 [Hz]（例: 8000）
 * @returns          サンプリング点の配列（時刻昇順）
 */
export function downsample(signal: AudioSignal, targetRate: number): SamplePoint[] {
  const { data, sampleRate: baseRate, duration } = signal;
  const points: SamplePoint[] = [];

  // サンプリング周期 [秒]。
  const periodSec = 1 / targetRate;

  // duration の間に取得できるサンプル数。
  const count = Math.floor(duration * targetRate);

  for (let n = 0; n < count; n++) {
    const timeSec = n * periodSec;
    // 時刻 timeSec に対応する元配列インデックス（最近傍を採用＝単純間引き）。
    const sourceIndex = Math.min(Math.round(timeSec * baseRate), data.length - 1);
    points.push({
      timeSec,
      amplitude: data[sourceIndex],
      sourceIndex,
    });
  }

  return points;
}
