/**
 * 正弦波（サイン波）の合成。
 *
 * 最も基本的な波形。1つの周波数成分だけを持つ。
 * 「音は連続的な波である」ことを示す入門用音源（要件§5.1）。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/**
 * @param durationSec 長さ [秒]
 * @param frequency   周波数 [Hz]（標準: 440Hz = ラの音）
 */
export function generateSine(durationSec: number, frequency = 440): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);

  // 振幅は 0.8 に抑える。±1.0 ぴったりだと、不適切なデジタル化（粗い量子化など）
  // で生じるノイズが過大になりやすいため、少し余裕を持たせる。
  const amplitude = 0.8;

  for (let i = 0; i < length; i++) {
    const t = i / BASE_SAMPLE_RATE; // 時刻 [秒]
    // y(t) = 0.8 · sin(2π f t)
    data[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
  }

  return data;
}
