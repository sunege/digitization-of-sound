/**
 * ドラム（打楽器）風の音の合成。
 *
 * 打楽器の音は明確な音程を持たず、短い「ノイズ的な破裂音」が
 * 急速に減衰する特徴がある。
 * ここではホワイトノイズ＋低い正弦波（胴鳴り）を急減衰させて表現する。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/**
 * @param durationSec 長さ [秒]
 * @param bodyFreq    胴鳴りの周波数 [Hz]（標準: 90Hz）。ピッチ変更で上下する。
 */
export function generateDrum(durationSec: number, bodyFreq = 90): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / BASE_SAMPLE_RATE;

    // ホワイトノイズ（-1〜+1のランダム値）＝打撃のアタック成分。
    const noise = Math.random() * 2 - 1;

    // 低い正弦波（胴の鳴り）。
    const body = Math.sin(2 * Math.PI * bodyFreq * t);

    // 急速な減衰（打楽器はすぐ音が消える）。
    const envelope = Math.exp(-18 * t);

    data[i] = (noise * 0.6 + body * 0.8) * envelope;
  }

  return data;
}
