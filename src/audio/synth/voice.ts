/**
 * 声（母音「あ・い・う」）風の音の合成（フォルマント共鳴方式）。
 *
 * 人の声の母音は、声帯の振動（基音＋豊富な倍音）が、声道の共鳴によって
 * 特定の周波数帯（フォルマント）で強調されてできている。
 * 母音の違いはフォルマント周波数の違いで決まる。
 *
 * 本実装では「あ→い→う」と母音を切り替えて発音する:
 *   - 倍音はすべて基音の整数倍（固定周波数）なので位相が連続し、音が崩れない。
 *   - 母音の切り替えは「各倍音の音量（フォルマント共鳴）」だけを時間変化させる。
 *     フォルマント周波数を時間でなめらかに補間するので、自然に母音が移り変わる。
 *
 * 教育用途の簡易表現であり、実際の発声とは異なる（要件§3.2）。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/** 1つのフォルマント（共鳴のピーク）。 */
interface Formant {
  freq: number; // 中心周波数 [Hz]
  bandwidth: number; // 帯域幅 [Hz]
  gain: number; // ピークの強さ
}

/** 母音ごとのフォルマント（あ・い・う）。 */
const VOWELS: Record<'a' | 'i' | 'u', Formant[]> = {
  // あ: F1高め・F2中くらい
  a: [
    { freq: 800, bandwidth: 130, gain: 1.0 },
    { freq: 1200, bandwidth: 160, gain: 0.6 },
    { freq: 2600, bandwidth: 250, gain: 0.3 },
  ],
  // い: F1低め・F2高め（明るい音）
  i: [
    { freq: 300, bandwidth: 100, gain: 1.0 },
    { freq: 2300, bandwidth: 200, gain: 0.7 },
    { freq: 3000, bandwidth: 250, gain: 0.3 },
  ],
  // う: F1低め・F2低め（こもった音）
  u: [
    { freq: 350, bandwidth: 100, gain: 1.0 },
    { freq: 800, bandwidth: 150, gain: 0.6 },
    { freq: 2400, bandwidth: 250, gain: 0.25 },
  ],
};

/** 発音順。 */
const SEQUENCE: ('a' | 'i' | 'u')[] = ['a', 'i', 'u'];

/** 周波数 f における共鳴ゲイン（フォルマントの山を合成した値）。 */
function formantGain(freq: number, formants: Formant[]): number {
  let gain = 0;
  for (const f of formants) {
    const half = f.bandwidth / 2;
    // 中心に近いほど 1、離れるほど 0 に近づく共鳴カーブ（Lorentzian）。
    gain += (f.gain * (half * half)) / (half * half + (freq - f.freq) ** 2);
  }
  return gain;
}

/**
 * 時刻の進行度 u（0〜1）に対応する「現在の母音フォルマント」を補間して返す。
 * 母音の境界をなめらかにつなぐため、隣り合う母音のフォルマントを線形補間する。
 */
function formantsAt(u: number): Formant[] {
  // u を母音区間（0..SEQUENCE.length-1）へ写す。
  const scaled = u * SEQUENCE.length - 0.5;
  const i0 = Math.max(0, Math.min(SEQUENCE.length - 1, Math.floor(scaled)));
  const i1 = Math.min(SEQUENCE.length - 1, i0 + 1);
  const frac = Math.max(0, Math.min(1, scaled - i0));

  const a = VOWELS[SEQUENCE[i0]];
  const b = VOWELS[SEQUENCE[i1]];
  // 同数のフォルマントなので各成分を補間。
  return a.map((fa, k) => {
    const fb = b[k];
    return {
      freq: fa.freq + (fb.freq - fa.freq) * frac,
      bandwidth: fa.bandwidth + (fb.bandwidth - fa.bandwidth) * frac,
      gain: fa.gain + (fb.gain - fa.gain) * frac,
    };
  });
}

/**
 * @param durationSec 長さ [秒]
 * @param pitch       声の高さ（基音）[Hz]（標準: 130Hz）
 */
export function generateVoice(durationSec: number, pitch = 130): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);

  // 基音の倍音の周波数を先に列挙（ナイキスト未満のみ。折り返し雑音回避）。
  const nyquist = BASE_SAMPLE_RATE / 2;
  const harmonics: number[] = [];
  for (let h = 1; h * pitch < nyquist; h++) harmonics.push(h * pitch);

  // 各母音区間の境界をなめらかにつなぐクロスフェード幅（進行度比）。
  for (let i = 0; i < length; i++) {
    const t = i / BASE_SAMPLE_RATE;
    const u = t / durationSec; // 進行度 0〜1

    // 現在の母音フォルマント。
    const formants = formantsAt(u);

    // 倍音を重ね合わせ（振幅はフォルマント共鳴＋声帯傾斜 1/h で決定）。
    let sample = 0;
    let ampSum = 0;
    for (let k = 0; k < harmonics.length; k++) {
      const freq = harmonics[k];
      const sourceAmp = 1 / (k + 1); // 高い倍音ほど弱い
      const amp = sourceAmp * formantGain(freq, formants);
      sample += amp * Math.sin(2 * Math.PI * freq * t);
      ampSum += amp;
    }
    if (ampSum > 0) sample /= ampSum; // -1..1 程度に正規化

    // 出だし/終わりのフェード（プツッと切れないように）。
    const fadeIn = Math.min(1, t / 0.04);
    const fadeOut = Math.min(1, (durationSec - t) / 0.04);
    const envelope = Math.max(0, Math.min(fadeIn, fadeOut));

    data[i] = sample * envelope * 0.8;
  }

  return data;
}
