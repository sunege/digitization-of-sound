/**
 * ピアノ風の音の合成（倍音加算合成）。
 *
 * 楽器の音は「基音 + 複数の倍音」が重なってできている。
 * ここでは基音とその整数倍の周波数（倍音）を足し合わせ、
 * 時間とともに音が減衰するエンベロープを掛けてピアノらしさを出す。
 *
 * 教育用途のため厳密な音色再現は行わない（要件§3.2）。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/**
 * @param durationSec 長さ [秒]
 * @param frequency   基音の周波数 [Hz]（標準: 261.6Hz = 中央ド）
 */
export function generatePiano(durationSec: number, frequency = 261.63): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);

  // 各倍音の相対的な強さ（基音が最も強く、高い倍音ほど弱い）。
  const harmonicGains = [1.0, 0.5, 0.3, 0.18, 0.1];

  for (let i = 0; i < length; i++) {
    const t = i / BASE_SAMPLE_RATE;

    // 倍音を重ね合わせる。
    let sample = 0;
    for (let h = 0; h < harmonicGains.length; h++) {
      const harmonicFreq = frequency * (h + 1);
      sample += harmonicGains[h] * Math.sin(2 * Math.PI * harmonicFreq * t);
    }

    // 減衰エンベロープ（弾いた瞬間が最大で徐々に小さくなる）。
    const envelope = Math.exp(-3 * t);

    data[i] = sample * envelope * 0.45; // クリップ(±1.0)しない範囲で音量を大きめに
  }

  return data;
}
