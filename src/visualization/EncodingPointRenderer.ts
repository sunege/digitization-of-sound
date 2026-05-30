/**
 * 符号化の進行を波形グラフ上に描くレイヤー（Step3）。
 *
 * 量子化点(●)に対して、符号化の状態を色と装飾で示す:
 *   - 変換済み      : 緑の塗りつぶし＋通し番号
 *   - 次に変換する点 : 点滅する強調リング（クリックを促す）
 *   - 未変換        : 量子化点と同じピンクの塗りつぶし(●)
 *
 * 「左から順に変換していく」流れを、グラフ側でも視認できるようにする。
 */
import type { Renderer, RenderContext } from '../types/render';
import type { SamplePoint } from '../math/sampling';
import type { QuantizedValue } from '../math/quantization';
import { theme } from './theme';

interface Options {
  samples: SamplePoint[];
  quantized: QuantizedValue[];
  /** 変換済みの個数（左から数えて）。 */
  encodedCount: number;
  /** 次の点を点滅で強調するか。 */
  highlightNext: boolean;
  /** 点滅の進捗（0〜1）。 */
  pulse: number;
}

/**
 * @param options samples/quantized と符号化の進捗
 */
export function makeEncodingPointRenderer(options: Options): Renderer {
  const { samples, quantized, encodedCount, highlightNext, pulse } = options;

  return ({ ctx, mapper }: RenderContext) => {
    for (let i = 0; i < samples.length; i++) {
      const x = mapper.timeToX(samples[i].timeSec);
      const y = mapper.ampToY(quantized[i].amplitude);

      // 表示範囲外（プロット領域の左右の外）の点は描かない。
      if (x < mapper.plotLeft || x > mapper.plotRight) continue;

      if (i < encodedCount) {
        // 変換済み: 緑の塗りつぶし＋通し番号。
        ctx.fillStyle = theme.binaryOn;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (i === encodedCount && highlightNext) {
        // 次に変換する点: 点滅リングで強調。
        const r = 6 + pulse * 4;
        ctx.strokeStyle = theme.samplePoint;
        ctx.globalAlpha = 1 - pulse * 0.6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 中心の点。
        ctx.fillStyle = theme.quantPoint;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 未変換: 量子化点と同じピンクの塗りつぶし（前ステップの量子化点と統一）。
        ctx.fillStyle = theme.quantPoint;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
}
