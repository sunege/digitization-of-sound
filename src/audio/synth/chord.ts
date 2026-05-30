/**
 * 和音（ドミソ）の合成。
 *
 * 根音・長3度・完全5度の3音を同時に鳴らす。
 * 複数の周波数が同時に存在することを、波形（複雑な形）と
 * 音（厚みのある響き）の両面で示す。
 *
 * 純粋な正弦波3つの和は音圧が小さく聞き取りづらいため、
 * 各音に倍音を少し加え（オルガン風）、明瞭度と音量を上げる。
 * 最後に実測ピークで正規化して、音量を一定に保つ。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/** 目標のピーク振幅。±1.0 ぴったりだと粗い量子化でノイズ過大になるため少し下げる。 */
const PEAK = 0.9;

/** 根音に対する周波数比（純正律のド・ミ・ソ）。 */
const RATIOS = [1, 5 / 4, 3 / 2];

/** 各音に加える倍音の相対強さ（基音・2倍音・3倍音）。音に厚みを出す。 */
const HARMONIC_GAINS = [1.0, 0.5, 0.25];

/**
 * @param durationSec 長さ [秒]
 * @param rootFreq    根音の周波数 [Hz]（標準: 261.63Hz = 中央ド）
 */
export function generateChord(durationSec: number, rootFreq = 261.63): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);

  // まず素のサンプルを作る（正規化は後でまとめて行う）。
  for (let i = 0; i < length; i++) {
    const t = i / BASE_SAMPLE_RATE;
    let sample = 0;
    for (const r of RATIOS) {
      const freq = rootFreq * r;
      // 各音に倍音を重ねて厚みを出す。
      for (let h = 0; h < HARMONIC_GAINS.length; h++) {
        sample += HARMONIC_GAINS[h] * Math.sin(2 * Math.PI * freq * (h + 1) * t);
      }
    }
    data[i] = sample;
  }

  // 実測ピークで正規化（位相の打ち消しに左右されず、常に PEAK まで使う）。
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const a = Math.abs(data[i]);
    if (a > peak) peak = a;
  }
  if (peak > 0) {
    const scale = PEAK / peak;
    for (let i = 0; i < length; i++) data[i] *= scale;
  }

  return data;
}
