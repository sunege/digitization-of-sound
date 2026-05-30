/**
 * 音源合成のまとめ。
 * SourceType から対応する音源信号(AudioSignal)を生成する。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';
import type { AudioSignal, SourceType } from '../../types/audio';
import { generateSine } from './sine';
import { generateSquare, generateSawtooth, generateTriangle } from './waves';
import { generateChirp } from './chirp';
import { generateChord } from './chord';
import { generateNoise } from './noise';
import { generatePiano } from './piano';
import { generateViolin } from './violin';
import { generateDrum } from './drum';
import { generateVoice } from './voice';

/** 合成音の標準の長さ [秒]。波形観察と再生のバランスで短め。 */
export const DEFAULT_DURATION = 1.5;

/** 各音源の標準の基音周波数 [Hz]。ピッチ倍率はこれに掛ける。 */
const BASE_PITCH: Record<Exclude<SourceType, 'mic'>, number> = {
  sine: 440, // ラの音
  square: 220, // 方形波
  sawtooth: 220, // のこぎり波
  triangle: 220, // 三角波
  chirp: 150, // チャープの開始周波数
  chord: 261.63, // 和音の根音（中央ド）
  noise: 1, // ノイズは音程なし（ピッチ未使用）
  piano: 261.63, // 中央ド
  violin: 440, // ラ
  drum: 90, // 胴鳴り
  voice: 130, // 声の高さ
};

/** ピッチ倍率の範囲（共通スライダー用）。 */
export const PITCH_RATIO_MIN = 0.5;
export const PITCH_RATIO_MAX = 2.0;

/**
 * 合成可能な音源（マイク以外）の信号を生成する。
 *
 * @param source      音源の種類（'mic' は録音で別途取得するため対象外）
 * @param durationSec 長さ [秒]
 * @param pitchRatio  ピッチ倍率（1.0 で標準、0.5 で1オクターブ下、2.0 で1オクターブ上）
 */
export function synthesize(
  source: Exclude<SourceType, 'mic'>,
  durationSec = DEFAULT_DURATION,
  pitchRatio = 1,
): AudioSignal {
  // 標準周波数に倍率を掛けた基音で合成する。
  const freq = BASE_PITCH[source] * pitchRatio;

  let data: Float32Array;
  switch (source) {
    case 'sine':
      data = generateSine(durationSec, freq);
      break;
    case 'square':
      data = generateSquare(durationSec, freq);
      break;
    case 'sawtooth':
      data = generateSawtooth(durationSec, freq);
      break;
    case 'triangle':
      data = generateTriangle(durationSec, freq);
      break;
    case 'chirp':
      data = generateChirp(durationSec, freq);
      break;
    case 'chord':
      data = generateChord(durationSec, freq);
      break;
    case 'noise':
      data = generateNoise(durationSec);
      break;
    case 'piano':
      data = generatePiano(durationSec, freq);
      break;
    case 'violin':
      data = generateViolin(durationSec, freq);
      break;
    case 'drum':
      data = generateDrum(durationSec, freq);
      break;
    case 'voice':
      data = generateVoice(durationSec, freq);
      break;
  }

  return { data, sampleRate: BASE_SAMPLE_RATE, duration: durationSec };
}

export {
  generateSine,
  generateSquare,
  generateSawtooth,
  generateTriangle,
  generateChirp,
  generateChord,
  generateNoise,
  generatePiano,
  generateViolin,
  generateDrum,
  generateVoice,
};
