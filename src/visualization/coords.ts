/**
 * Canvas の座標変換。
 *
 * 「時刻[秒]・振幅[-1..1]」という意味のある単位を、
 * Canvas のピクセル座標へ変換する責務だけを持つ。
 * 各 renderer はこの変換器(mapper)を使って描画する。
 *
 * データ（波形・点）は「プロット領域」の内側だけに描き、
 * その外周のマージンに軸ラベル（時間ms・量子化レベル番号）を置く。
 * これにより軸の数値とデータが重ならない。
 */
import type { CoordinateMapper } from '../types/render';
import type { Viewport } from '../types/audio';

/**
 * プロット領域の外周マージン [px]。
 * - left  : 量子化レベル番号（縦軸）用
 * - bottom: 時間ラベル（横軸）用
 */
export const PLOT_MARGIN = {
  left: 52, // 量子化レベル番号（最大5桁）が見切れないよう確保
  right: 10,
  top: 8,
  bottom: 26,
} as const;

/**
 * ビューポートと描画サイズから座標変換器を作る。
 *
 * @param viewport 表示範囲（開始時刻・時間幅・振幅倍率）
 * @param width    描画領域の幅 [px]（CSSピクセル, キャンバス全体）
 * @param height   描画領域の高さ [px]（CSSピクセル, キャンバス全体）
 */
export function createMapper(viewport: Viewport, width: number, height: number): CoordinateMapper {
  const { startSec, spanSec, ampScale } = viewport;

  // プロット領域（データを描く内側の矩形）の境界。
  const plotLeft = PLOT_MARGIN.left;
  const plotRight = width - PLOT_MARGIN.right;
  const plotTop = PLOT_MARGIN.top;
  const plotBottom = height - PLOT_MARGIN.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  return {
    width,
    height,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,

    // 時刻 → x。表示開始時刻をプロット左端、終了時刻をプロット右端に対応させる。
    timeToX(timeSec: number): number {
      const ratio = (timeSec - startSec) / spanSec;
      return plotLeft + ratio * plotWidth;
    },

    // 振幅 → y。+1 をプロット上端、-1 をプロット下端に。中央(0)が縦中央。
    // y軸は下向きが正なので符号を反転する。
    ampToY(amplitude: number): number {
      const centered = amplitude * ampScale; // -1..1 を倍率調整
      // centered=+1 → plotTop, centered=-1 → plotBottom
      return plotTop + (1 - centered) * (plotHeight / 2);
    },
  };
}
