/**
 * マイク録音。
 *
 * getUserMedia でマイク入力を取得し、一定時間録音して
 * Float32Array(モノラル) として返す。
 * 教育用途のため最小限の実装（ノイズ除去等はしない）。
 */
import { getAudioContext } from './playback';
import type { AudioSignal } from '../types/audio';

/**
 * 指定秒数だけマイクから録音する。
 *
 * @param durationSec 録音時間 [秒]
 */
export async function recordMic(durationSec: number): Promise<AudioSignal> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = getAudioContext();

  const sourceNode = ctx.createMediaStreamSource(stream);

  // ScriptProcessor は非推奨だが、教育用途・短時間録音には十分かつ簡潔。
  const bufferSize = 4096;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);

  const chunks: Float32Array[] = [];
  let collected = 0;
  const targetSamples = Math.floor(durationSec * ctx.sampleRate);

  return new Promise<AudioSignal>((resolve) => {
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(input));
      collected += input.length;

      if (collected >= targetSamples) {
        // 後片付け。
        processor.disconnect();
        sourceNode.disconnect();
        stream.getTracks().forEach((t) => t.stop());

        // チャンクを連結して目標長に切り詰める。
        const data = new Float32Array(targetSamples);
        let offset = 0;
        for (const chunk of chunks) {
          const remain = targetSamples - offset;
          if (remain <= 0) break;
          data.set(chunk.subarray(0, remain), offset);
          offset += chunk.length;
        }

        resolve({ data, sampleRate: ctx.sampleRate, duration: durationSec });
      }
    };

    sourceNode.connect(processor);
    // 出力は鳴らさないが、ScriptProcessor を動かすため destination へ接続。
    processor.connect(ctx.destination);
  });
}
