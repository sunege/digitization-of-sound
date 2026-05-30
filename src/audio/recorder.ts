/**
 * マイク録音（要件§7.2 mic）。
 *
 * getUserMedia でマイク入力を取得し、指定秒数だけ録音して
 * BASE_SAMPLE_RATE の Float32Array（モノラル, -1〜+1）に変換する。
 *
 * マイクは「準備（許可取得＋ウォームアップ）」と「録音」の2段階に分ける。
 * 準備が終わってから録音を開始することで、マイク起動直後の不安定な
 * 数百msが録音の先頭に混ざるのを防ぐ（録音が頭から欠ける問題への対策）。
 *
 * 準備中はマイクが動き続けるので、AnalyserNode から現在の波形を読み出して
 * オシロスコープのようにリアルタイム表示できる（getWaveform）。
 */
import { BASE_SAMPLE_RATE } from '../types/audio';
import type { AudioSignal } from '../types/audio';

/** 準備済みマイク。record() で録音、getWaveform() で生波形取得、close() で開放。 */
export interface MicRecorder {
  /** 指定秒数だけ録音して信号を返す。 */
  record: (durationSec: number) => Promise<AudioSignal>;
  /** 現在の波形スナップショット（時間領域）を out に書き込む。オシロスコープ表示用。 */
  getWaveform: (out: Float32Array) => void;
  /** getWaveform に渡すバッファの長さ（= analyser.fftSize）。 */
  frameSize: number;
  /** マイク・AudioContext を開放する。 */
  close: () => Promise<void>;
}

/**
 * マイクを準備する（許可取得→ストリーム開通→ウォームアップ開始）。
 *
 * 戻り値の record() を呼ぶまで実際の録音は始めない。準備から録音開始までの
 * 間、マイクは動き続けるので、ユーザーが「録音開始」を押す頃には安定している。
 */
export async function prepareMic(): Promise<MicRecorder> {
  // マイクの使用許可を求め、入力ストリームを取得する。
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // 録音用の AudioContext（ブラウザ標準レートで取り込み、後で基準レートへ変換）。
  const ctx = new AudioContext();
  // 自動再生ポリシーで suspended の場合に備えて明示的に再開する。
  if (ctx.state === 'suspended') await ctx.resume();

  const source = ctx.createMediaStreamSource(stream);

  // リアルタイム波形表示用。直近の時間領域サンプルを覗き見るためのノード。
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048; // 約 fftSize/sampleRate 秒ぶんの波形が見える
  source.connect(analyser);

  // ScriptProcessor で生サンプルを集める（簡潔さ優先。非推奨だが教育用途では十分）。
  const bufferSize = 4096;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  source.connect(processor);
  processor.connect(ctx.destination);

  // 準備中はサンプルを捨て続ける（マイクを動かしてウォームアップしておく）。
  processor.onaudioprocess = () => {};

  const recordedRate = ctx.sampleRate;

  const getWaveform = (out: Float32Array): void => {
    // TS5.7+ の TypedArray ジェネリクス差異を吸収（ArrayBufferLike → ArrayBuffer）。
    analyser.getFloatTimeDomainData(out as Float32Array<ArrayBuffer>);
  };

  const record = (durationSec: number): Promise<AudioSignal> => {
    const chunks: Float32Array[] = [];

    return new Promise<AudioSignal>((resolve) => {
      const startTime = ctx.currentTime;
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(input));
        if (ctx.currentTime - startTime >= durationSec) {
          // 録音完了。以降のフレームは捨てる。
          processor.onaudioprocess = () => {};

          // 集めたチャンクを1本の Float32Array に連結する。
          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          const merged = new Float32Array(totalLength);
          let offset = 0;
          for (const c of chunks) {
            merged.set(c, offset);
            offset += c.length;
          }

          // ブラウザのレートから BASE_SAMPLE_RATE へ単純リサンプリング（最近傍）。
          const ratio = recordedRate / BASE_SAMPLE_RATE;
          const outLength = Math.floor(merged.length / ratio);
          const out = new Float32Array(outLength);
          for (let i = 0; i < outLength; i++) {
            out[i] = merged[Math.floor(i * ratio)];
          }

          resolve({ data: out, sampleRate: BASE_SAMPLE_RATE, duration: durationSec });
        }
      };
    });
  };

  const close = async (): Promise<void> => {
    processor.onaudioprocess = null;
    processor.disconnect();
    analyser.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    await ctx.close();
  };

  return { record, getWaveform, frameSize: analyser.fftSize, close };
}
