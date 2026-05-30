/**
 * 基本波形（方形波・のこぎり波・三角波）の合成。
 *
 * いずれも正弦波より倍音が豊富。サンプリング周波数を下げると、
 * ナイキスト周波数を超える倍音が折り返って「エイリアシング雑音」になり、
 * 標本化の理解（高周波成分が失われる・歪む §5.2）に役立つ。
 *
 * 教育用途のため帯域制限はしない単純な数式生成（要件§3.2）。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/** 振幅。±1.0 ぴったりだと粗い量子化でノイズが過大になるため少し抑える。 */
const AMP = 0.8;

/** 各時刻の位相 phase（0〜1 の繰り返し）を求める小ヘルパ。 */
function phaseAt(i: number, frequency: number): number {
  const t = i / BASE_SAMPLE_RATE;
  const p = t * frequency;
  return p - Math.floor(p); // 0〜1
}

/**
 * 方形波。1周期の前半 +1、後半 -1。奇数倍音のみを含む。
 * @param frequency 周波数 [Hz]（標準: 220Hz）
 */
export function generateSquare(durationSec: number, frequency = 220): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    data[i] = (phaseAt(i, frequency) < 0.5 ? 1 : -1) * AMP;
  }
  return data;
}

/**
 * のこぎり波。-1→+1 へ直線的に上がり、急に戻る。全ての倍音を含む。
 * @param frequency 周波数 [Hz]（標準: 220Hz）
 */
export function generateSawtooth(durationSec: number, frequency = 220): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    // 位相 0〜1 を -1〜+1 へ。
    data[i] = (phaseAt(i, frequency) * 2 - 1) * AMP;
  }
  return data;
}

/**
 * 三角波。なめらかな山型。倍音は少なめ（奇数倍音が急減衰）。
 * @param frequency 周波数 [Hz]（標準: 220Hz）
 */
export function generateTriangle(durationSec: number, frequency = 220): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const p = phaseAt(i, frequency);
    // p=0→ -1, p=0.5→ +1, p=1→ -1 の三角形。
    data[i] = (4 * Math.abs(p - 0.5) - 1) * -1 * AMP;
  }
  return data;
}
