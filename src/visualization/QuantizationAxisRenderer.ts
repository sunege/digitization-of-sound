/**
 * 量子化レベルの縦軸ラベル。
 *
 * 各量子化レベルに対応する高さに「レベル番号（0, 1, 2…）」を表示する。
 * このレベル番号は Step3（符号化）で2進数へ変換される値そのもの。
 *
 * ラベルはプロット領域の外側（左マージン）に描くので、データと重ならない。
 * グリッド線（横線）の表示有無とは独立に常に描く。
 * ビット数が多くレベルが密になる場合は、最小間隔を保つよう数値を間引く。
 */
import type { Renderer, RenderContext } from '../types/render';
import { theme } from './theme';
import { quantizationLevels } from '../math/quantization';

/** ラベル同士の最小ピクセル間隔（これ未満なら間引く）。 */
const MIN_LABEL_GAP_PX = 20;
/** ラベルの文字サイズ [px]。 */
const FONT_SIZE = 12;
/** プロット左端からラベル右端までの隙間 [px]。 */
const LABEL_GAP_FROM_PLOT = 6;

/** レベル番号 i（0〜levels-1）を振幅 [-1,1] へ対応させる。 */
function levelToAmplitude(i: number, levels: number): number {
  return levels > 1 ? (i / (levels - 1)) * 2 - 1 : 0;
}

/**
 * 量子化レベルの縦軸ラベルを描く renderer を作る。
 * @param bitDepth 量子化ビット数
 */
export function makeQuantizationAxisRenderer(bitDepth: number): Renderer {
  return ({ ctx, mapper }: RenderContext) => {
    const levels = quantizationLevels(bitDepth);

    // 表示するレベル番号を選ぶ:
    // 最上位(levels-1)を必ず含め、上から下へ最小間隔を満たす番号だけ採用する。
    // これにより最大値とその一つ手前が重ならない。
    const indices: number[] = [];
    let lastY = Number.NEGATIVE_INFINITY;
    for (let i = levels - 1; i >= 0; i--) {
      const y = mapper.ampToY(levelToAmplitude(i, levels));
      if (y - lastY >= MIN_LABEL_GAP_PX) {
        indices.push(i);
        lastY = y;
      }
    }

    ctx.save();
    ctx.font = `bold ${FONT_SIZE}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    // プロット左端のすぐ左に右寄せで並べる（マージン内なのでデータと重ならない）。
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.quantLabel;

    const labelX = mapper.plotLeft - LABEL_GAP_FROM_PLOT;
    for (const i of indices) {
      ctx.fillText(String(i), labelX, mapper.ampToY(levelToAmplitude(i, levels)));
    }

    ctx.restore();
  };
}
