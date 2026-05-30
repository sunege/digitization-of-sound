/**
 * Web Audio API を使った音声再生。
 *
 * AudioContext はページ全体で1つだけ共有する（生成コストが高く、
 * ブラウザの同時生成数にも上限があるため）。
 */
import type { AudioSignal } from '../types/audio';

let sharedContext: AudioContext | null = null;

/** 共有 AudioContext を取得（無ければ生成）。 */
export function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  // ユーザー操作前は suspended のことがあるので明示的に resume。
  if (sharedContext.state === 'suspended') {
    void sharedContext.resume();
  }
  return sharedContext;
}

/**
 * AudioSignal(Float32Array) を AudioBuffer に変換する。
 *
 * Web Audio API の createBuffer には sampleRate の下限（仕様上 3000Hz、
 * 実装により 8000Hz のことも）がある。サンプリング周波数を下げた信号を
 * その低レートのまま渡すと例外になり再生できない。
 *
 * そこで、信号レートに依存せず常に AudioContext の標準レートでバッファを作り、
 * 元の各サンプルを「ゼロ次ホールド（サンプル&ホールド）」で引き伸ばして書き込む。
 * これはデジタル化後に実際に聞こえる階段状の波形そのものなので、
 * 低いサンプリング周波数でも正しく（劣化した音質のまま）再生できる。
 */
function toAudioBuffer(ctx: AudioContext, signal: AudioSignal): AudioBuffer {
  const outRate = ctx.sampleRate; // AudioContext の標準レート（例: 44100/48000）
  const outLength = Math.max(1, Math.round(signal.duration * outRate));
  const buffer = ctx.createBuffer(1, outLength, outRate);
  const out = buffer.getChannelData(0);

  // 元レートと出力レートの比。出力サンプル位置 i に対応する元サンプルを拾う。
  const ratio = signal.sampleRate / outRate;
  for (let i = 0; i < outLength; i++) {
    // ゼロ次ホールド: 出力時刻に対応する元インデックスを切り捨てで求める。
    const srcIndex = Math.min(signal.data.length - 1, Math.floor(i * ratio));
    out[i] = signal.data[srcIndex];
  }

  return buffer;
}

/**
 * 信号を再生する。返り値は停止用の関数。
 *
 * @param signal   再生する信号
 * @param onEnded  再生終了時のコールバック（任意）
 */
export function playSignal(signal: AudioSignal, onEnded?: () => void): () => void {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = toAudioBuffer(ctx, signal);
  source.connect(ctx.destination);
  if (onEnded) {
    source.onended = onEnded;
  }
  source.start();

  // 停止関数を返す。
  return () => {
    try {
      source.stop();
    } catch {
      // 既に停止済みなら無視。
    }
  };
}
