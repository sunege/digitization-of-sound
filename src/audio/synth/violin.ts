/**
 * バイオリン（ストリング）風の音の合成。
 *
 * バイオリンの音響的特徴を倍音加算で近似する:
 *   - 弓で弦を擦る運動により、のこぎり波に近い豊かな倍音を持つ。
 *   - 立ち上がりが緩やか（弓を当ててから音が育つ）。
 *   - ビブラート（演奏者の指の揺れによる周期的なピッチ変化）がある。
 *
 * ビブラートは周波数が時間変化するため、各倍音の「瞬時位相」を
 * 積分（毎サンプル加算）して求める。sin(2π·f(t)·t) と書くと位相が
 * ずれて音が崩れるため、位相を逐次更新する方式にする。
 *
 * 教育用途のため厳密な音色再現は行わない（要件§3.2）。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/** 目標のピーク振幅（クリップ回避のため少し下げる）。 */
const PEAK = 0.85;

/** 倍音の本数（多めにしてストリングらしい明るさを出す）。 */
const NUM_HARMONICS = 12;

/** ビブラート設定。 */
const VIBRATO_HZ = 5.5; // 揺れの速さ [Hz]
const VIBRATO_DEPTH = 0.005; // 揺れの深さ（基音に対する比率, ±0.5%）

/**
 * @param durationSec 長さ [秒]
 * @param frequency   基音の周波数 [Hz]（標準: 440Hz = ラ）
 */
export function generateViolin(durationSec: number, frequency = 440): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);

  // 各倍音の現在位相 [ラジアン]。毎サンプル進めていく。
  const phases = new Float32Array(NUM_HARMONICS);
  // 各倍音の相対強さ（のこぎり波風に 1/n で減衰）。
  const gains: number[] = [];
  for (let h = 1; h <= NUM_HARMONICS; h++) gains.push(1 / h);

  const dt = 1 / BASE_SAMPLE_RATE;

  for (let i = 0; i < length; i++) {
    const t = i * dt;

    // ビブラート: 基音をなめらかに上下させる現在の周波数倍率。
    const vibrato = 1 + VIBRATO_DEPTH * Math.sin(2 * Math.PI * VIBRATO_HZ * t);
    const f0 = frequency * vibrato;

    // 全倍音を、位相を積分しながら重ね合わせる。
    let sample = 0;
    for (let h = 0; h < NUM_HARMONICS; h++) {
      const freq = f0 * (h + 1);
      // ナイキスト周波数を超える倍音は折り返し雑音になるので足さない。
      if (freq >= BASE_SAMPLE_RATE / 2) break;
      phases[h] += 2 * Math.PI * freq * dt; // 瞬時位相を進める
      sample += gains[h] * Math.sin(phases[h]);
    }

    // 緩やかな立ち上がり＋緩やかな減衰（弓で弾く弦楽器らしいエンベロープ）。
    const attack = Math.min(1, t / 0.15); // 0.15秒かけて立ち上がる
    const release = Math.min(1, (durationSec - t) / 0.15); // 終端 0.15秒でフェード
    const envelope = Math.max(0, Math.min(attack, release));

    data[i] = sample * envelope;
  }

  // 実測ピークで正規化（倍音合計の振幅は基音周波数で変わるため）。
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
