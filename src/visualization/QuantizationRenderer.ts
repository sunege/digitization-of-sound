/**
 * 量子化点レイヤー（要件§12.1 レイヤー5, §9.3）。
 *
 * - 元のサンプリング点(●)から最も近い量子化レベルへ「吸着」する様子を見せる。
 * - move（0〜1）に応じて、点が元位置→量子化レベルへ線形補間で移動する。
 * - showErrorLines が true なら、元点と量子化点の差（誤差）を赤線で表示する。
 */
import type { Renderer, RenderContext } from '../types/render';
import type { SamplePoint } from '../math/sampling';
import type { QuantizedValue } from '../math/quantization';
import { lerp, easeOutCubic } from '../math/interpolation';
import { theme } from './theme';

interface Options {
  /** 吸着の進捗（0=元位置, 1=量子化レベル）。 */
  move?: number;
  /** 量子化誤差の赤線を描くか。 */
  showErrorLines?: boolean;
  /** 元のサンプル点(●)も重ねて描くか。 */
  showSamplePoints?: boolean;
}

/**
 * @param samples   元のサンプリング点
 * @param quantized 各サンプルの量子化結果（samples と同じ並び・長さ）
 * @param options   move: 吸着進捗 / showErrorLines / showSamplePoints
 */
export function makeQuantizationRenderer(
  samples: SamplePoint[],
  quantized: QuantizedValue[],
  options: Options = {},
): Renderer {
  const { move = 1, showErrorLines = false, showSamplePoints = false } = options;

  return ({ ctx, mapper }: RenderContext) => {
    // 0→1 をイージングして、吸着の動きを自然にする。
    const t = easeOutCubic(move);

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const q = quantized[i];
      const x = mapper.timeToX(s.timeSec);

      // 表示範囲外（プロット領域の左右の外）の点は描かない。
      if (x < mapper.plotLeft || x > mapper.plotRight) continue;

      // 元の振幅 → 量子化後の振幅へ補間した現在位置。
      const currentAmp = lerp(s.amplitude, q.amplitude, t);
      const yCurrent = mapper.ampToY(currentAmp);
      const yOriginal = mapper.ampToY(s.amplitude);

      // 量子化誤差の線（元点 → 現在の量子化点）。
      if (showErrorLines && t > 0) {
        ctx.strokeStyle = theme.errorLine;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, yOriginal);
        ctx.lineTo(x, yCurrent);
        ctx.stroke();
      }

      // 元点（●: 塗りつぶし）。移動中は出発点を残して動きを見せる。
      if (showSamplePoints) {
        drawFilledDot(ctx, x, yOriginal, theme.samplePoint);
      }
      // 量子化点（ピンクの点）が吸着先へ移動する。サイズはサンプル点と揃える。
      drawFilledDot(ctx, x, yCurrent, theme.quantPoint, 4);
    }
  };
}

function drawFilledDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius = 3,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
