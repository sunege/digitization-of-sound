/**
 * 符号化の進行を波形グラフ上に描くレイヤー（Step3）。
 *
 * 量子化点(○)に対して、符号化の状態を色と装飾で示す:
 *   - 変換済み      : 緑の塗りつぶし＋通し番号
 *   - 次に変換する点 : 点滅する強調リング（クリックを促す）
 *   - 未変換        : 通常の量子化点(○)
 *
 * 「左から順に変換していく」流れを、グラフ側でも視認できるようにする。
 */
import type { Renderer, RenderContext } from '../types/render';
import type { SamplePoint } from '../math/sampling';
import type { QuantizedValue } from '../math/quantization';
import { theme } from './theme';

interface Options {
  /** 表示対象の点（時刻昇順, 表示区間内）。 */
  samples: SamplePoint[];
  quantized: QuantizedValue[];
  /** 変換済みの個数（先頭から）。 */
  encodedCount: number;
  /** 「次に変換する点」を強調するか（自動変換中は不要）。 */
  highlightNext: boolean;
  /** 点滅用の位相（0〜1）。 */
  pulse: number;
}

export function makeEncodingPointRenderer(options: Options): Renderer {
  const { samples, quantized, encodedCount, highlightNext, pulse } = options;

  return ({ ctx, mapper }: RenderContext) => {
    for (let i = 0; i < samples.length; i++) {
      const x = mapper.timeToX(samples[i].timeSec);
      const y = mapper.ampToY(quantized[i].amplitude);

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
        // 本体（中空のピンク）。
        drawHollow(ctx, x, y, theme.quantPoint);
      } else {
        // 未変換: 通常の量子化点。
        drawHollow(ctx, x, y, theme.quantPoint);
      }
    }
  };
}

function drawHollow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = theme.background;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
