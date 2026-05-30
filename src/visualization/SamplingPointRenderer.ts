/**
 * サンプリング点レイヤー（要件§12.1 レイヤー4, §8.2, §8.3）。
 *
 * - 等間隔のサンプリング点を「点」で表示する。
 * - reveal（0〜1）に応じて左→右に順番に現れる（「測定している感」§8.3）。
 * - showDropLines が true なら各点に縦線（落下線）を添える。
 */
import type { Renderer, RenderContext } from '../types/render';
import type { SamplePoint } from '../math/sampling';
import { theme } from './theme';

interface Options {
  /**
   * 左→右に現れる割合（0〜1）。1で全点表示。
   * 「Canvas幅に対するx位置の割合」で判定するので、表示範囲を拡大していても
   * 画面内で左から右へ順番に点が現れる（グリッド線の reveal と基準を揃える）。
   */
  reveal?: number;
  /** 中央軸から点までの縦線（測定線）を描くか。 */
  showDropLines?: boolean;
  /** サンプリング点（●）そのものを描くか。 */
  showPoints?: boolean;
  /** 不透明度（0〜1）。フェードアウトに使う。 */
  opacity?: number;
}

/**
 * @param points  サンプリング点（時刻昇順）
 * @param options reveal: 出現割合 / showDropLines: 縦線の有無 / showPoints: 点の有無 / opacity: 不透明度
 */
export function makeSamplingPointRenderer(points: SamplePoint[], options: Options = {}): Renderer {
  const { reveal = 1, showDropLines = true, showPoints = true, opacity = 1 } = options;

  return ({ ctx, mapper }: RenderContext) => {
    // reveal=0 または完全透明のときは1点も描かない。
    if (reveal <= 0 || opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    // 「現在ここまで測定した」境界のx座標（プロット領域基準）。
    const revealX = mapper.plotLeft + reveal * (mapper.plotRight - mapper.plotLeft);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const x = mapper.timeToX(p.timeSec);
      // 表示範囲より前（プロット左端より左）の点は描かない。
      if (x < mapper.plotLeft) continue;
      // 境界より右の点はまだ測定していない（または表示範囲外）ので描かない。
      if (x > revealX) break;
      const yPoint = mapper.ampToY(p.amplitude);

      if (showDropLines) {
        // 落下する縦線（中央軸から測定値まで）。
        // サンプリング格子（黄の破線）と同系色なので、太い実線にして区別する。
        const yCenter = mapper.ampToY(0);
        ctx.strokeStyle = theme.sampleLine;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, yCenter);
        ctx.lineTo(x, yPoint);
        ctx.stroke();
      }

      // サンプリング点。
      if (showPoints) {
        drawDot(ctx, x, yPoint, theme.samplePoint);
      }
    }

    ctx.restore();
  };
}

/** 塗りつぶした円（点）を描く小ヘルパ。 */
function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}
