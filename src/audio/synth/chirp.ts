/**
 * チャープ（周波数スイープ）の合成。
 *
 * 周波数が低音→高音へ連続的に上がっていく純音。
 * サンプリング周波数が足りないと、ナイキスト周波数を超えた瞬間から
 * 高音が低音へ「折り返って」聞こえる＝エイリアシングが耳で分かる（§5.2）。
 *
 * 重要: 周波数が時間変化するので、位相は f(t) を積分して求める。
 * 単純に sin(2π·f(t)·t) と書くと位相がずれて音が壊れるため、
 * 線形チャープの位相 φ(t) = 2π( f0·t + (f1-f0)·t²/(2T) ) を使う。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/** 振幅。 */
const AMP = 0.8;
/** スイープの終端は開始周波数の何倍か。 */
const SWEEP_RATIO = 40;

/**
 * @param durationSec 長さ [秒]
 * @param startFreq   開始周波数 [Hz]（標準: 150Hz）。終端は startFreq×SWEEP_RATIO。
 */
export function generateChirp(durationSec: number, startFreq = 150): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);

  const f0 = startFreq;
  // 終端周波数は基準レートのナイキスト未満に収める（元波形自体は歪ませない）。
  const f1 = Math.min(startFreq * SWEEP_RATIO, BASE_SAMPLE_RATE / 2 - 100);
  const T = durationSec;

  for (let i = 0; i < length; i++) {
    const t = i / BASE_SAMPLE_RATE;
    // 線形チャープの瞬時位相（周波数を時間積分したもの）。
    const phase = 2 * Math.PI * (f0 * t + ((f1 - f0) * t * t) / (2 * T));
    data[i] = Math.sin(phase) * AMP;
  }

  return data;
}
