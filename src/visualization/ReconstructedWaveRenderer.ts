/**
 * 復元波形レイヤー（要件§12.1 レイヤー6, §12.2）。
 *
 * サンプリング/量子化された点を「ゼロ次ホールド」で結ぶと
 * 階段状の波形になる。これがデジタル化後に実際に再生される波形。
 * 元の滑らかな波形との違い（角張り・段差）を視認させる。
 */
import type { Renderer, RenderContext } from '../types/render';
import { theme } from './theme';

/** 階段の各段の値（時刻昇順）。 */
export interface StairPoint {
  timeSec: number;
  amplitude: number;
}

/**
 * @param points 階段の頂点（Step1ならサンプリング点、Step2なら量子化点）
 */
export function makeReconstructedWaveRenderer(points: StairPoint[]): Renderer {
  return ({ ctx, mapper }: RenderContext) => {
    if (points.length === 0) return;

    // 表示範囲（プロット領域）内の点だけで階段線を描く。
    // 範囲外の点まで結ぶと軸ラベル用の左マージンへはみ出すため。
    const visible = points.filter((p) => {
      const x = mapper.timeToX(p.timeSec);
      return x >= mapper.plotLeft && x <= mapper.plotRight;
    });
    if (visible.length === 0) return;

    ctx.strokeStyle = theme.reconstructed;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < visible.length; i++) {
      const x = mapper.timeToX(visible[i].timeSec);
      const y = mapper.ampToY(visible[i].amplitude);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // ゼロ次ホールド: 前の値を保ったまま水平に進み、次点で垂直に移動。
        const prevY = mapper.ampToY(visible[i - 1].amplitude);
        ctx.lineTo(x, prevY); // 水平
        ctx.lineTo(x, y); // 垂直
      }
    }

    ctx.stroke();
  };
}
