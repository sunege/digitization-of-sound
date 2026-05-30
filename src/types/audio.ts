/**
 * 音声・デジタル化に関する型定義。
 *
 * このアプリでは音声を Float32Array（値域 -1.0 〜 +1.0）で扱う。
 * 「アナログ波形」も内部的には高いサンプリングレート(BASE_SAMPLE_RATE)の
 * デジタルデータだが、十分に密なので連続波形の近似として扱う。
 */

/** 選択可能な音源の種類。 */
export type SourceType =
  | 'sine'
  | 'square'
  | 'sawtooth'
  | 'triangle'
  | 'chirp'
  | 'chord'
  | 'noise'
  | 'piano'
  | 'violin'
  | 'drum'
  | 'voice'
  | 'mic';

/** 連続波形を近似する基準サンプリングレート [Hz]。 */
export const BASE_SAMPLE_RATE = 44100;

/** 1つの音声信号。data の各要素は -1.0〜+1.0 の振幅値。 */
export interface AudioSignal {
  /** 振幅サンプル列（-1.0 〜 +1.0）。 */
  data: Float32Array;
  /** この信号のサンプリングレート [Hz]。 */
  sampleRate: number;
  /** 再生時間 [秒]。 */
  duration: number;
}

/** デジタル化パラメータ。各Stepで共有・引き継ぐ。 */
export interface DigitizationParams {
  /** サンプリング周波数 [Hz]（Step1）。 */
  sampleRate: number;
  /** 量子化ビット数 [bit]（Step2）。 */
  bitDepth: number;
  /** チャンネル数。初期版はモノラル固定。 */
  channels: 1;
}

/**
 * 波形描画の表示範囲（数ms単位の拡大表示に使用）。
 * - startSec: 表示開始時刻 [秒]
 * - spanSec : 表示する時間幅 [秒]
 * - ampScale: 振幅方向の表示倍率（1.0で -1〜+1 がCanvasの上下いっぱい）
 */
export interface Viewport {
  startSec: number;
  spanSec: number;
  ampScale: number;
}
