/**
 * グリッドレイヤー（要件§12.1 レイヤー2, §8.4, §9.2）。
 *
 * - 横方向グリッド: サンプリング間隔を表す縦線（時間軸の目盛り）。
 * - 縦方向グリッド: 量子化レベルを表す横線。
 *
 * いずれも「必要なときだけ」描く。Step0では中央軸のみ。
 * 線はすべてプロット領域（データ描画域）の内側に収める。
 */
import type { Renderer, RenderContext } from '../types/render';
import { theme } from './theme';
import { quantizationLevels } from '../math/quantization';
import { clamp01 } from '../math/interpolation';

/** 中央の振幅0ラインを描く（常時）。プロット領域の幅いっぱいに引く。 */
export const renderCenterAxis: Renderer = ({ ctx, mapper }) => {
  const y = mapper.ampToY(0);
  ctx.strokeStyle = theme.gridLineStrong;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mapper.plotLeft, y);
  ctx.lineTo(mapper.plotRight, y);
  ctx.stroke();
};

/**
 * サンプリング間隔の縦線を描く（横方向グリッド）。
 *
 * @param sampleRate サンプリング周波数 [Hz]
 * @param reveal     左→右に現れる割合（0〜1）。1で全線表示。
 *                   サンプリング実行アニメで「測っている範囲」を表す。
 */
export function makeSamplingGridRenderer(sampleRate: number, reveal = 1): Renderer {
  return ({ ctx, mapper, viewport }: RenderContext) => {
    const periodSec = 1 / sampleRate; // サンプリング周期

    // 表示範囲内のサンプリング時刻ごとに縦線を引く。
    const start = Math.ceil(viewport.startSec / periodSec);
    const end = Math.floor((viewport.startSec + viewport.spanSec) / periodSec);
    // 線が多すぎると見づらいので上限を設ける（教育用途の視認性優先）。
    if (end - start > 400) return;

    ctx.save();
    // 量子化格子と同様、専用色＋破線で見やすくする（サンプル点と同系の黄）。
    ctx.strokeStyle = theme.samplingGrid;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // reveal に応じて、プロット左端から進む「現在位置」までの線だけ引く。
    const revealX = mapper.plotLeft + reveal * (mapper.plotRight - mapper.plotLeft);

    for (let n = start; n <= end; n++) {
      const x = mapper.timeToX(n * periodSec);
      if (x > revealX) break;
      ctx.beginPath();
      ctx.moveTo(x, mapper.plotTop);
      ctx.lineTo(x, mapper.plotBottom);
      ctx.stroke();
    }
    ctx.restore();
  };
}

/**
 * 量子化レベルの横線を描く（縦方向グリッド）。
 *
 * @param bitDepth 量子化ビット数
 * @param reveal   左→右に伸びる割合（0〜1）。1でプロット右端まで到達。
 *                 量子化実行アニメで「丸める先の候補が現れる」演出に使う。
 */
export function makeQuantizationGridRenderer(bitDepth: number, reveal = 1): Renderer {
  return ({ ctx, mapper }: RenderContext) => {
    const levels = quantizationLevels(bitDepth);
    // 段数が多すぎる場合は描かない（16bit=65536段は線にならないため）。
    if (levels > 64) return;

    ctx.save();
    ctx.strokeStyle = theme.quantLevel;
    ctx.lineWidth = 1;
    // 破線にして、実線の中央軸（グレー）と線種でも区別しやすくする。
    ctx.setLineDash([4, 4]);

    // 線はプロット左端から右へ伸びていく（reveal で右端を制御）。
    const lineEndX =
      mapper.plotLeft + clamp01(reveal) * (mapper.plotRight - mapper.plotLeft);

    for (let i = 0; i < levels; i++) {
      // レベル i を振幅 [-1,1] に対応させる。
      const amp = levels > 1 ? (i / (levels - 1)) * 2 - 1 : 0;
      const y = mapper.ampToY(amp);
      ctx.beginPath();
      ctx.moveTo(mapper.plotLeft, y);
      ctx.lineTo(lineEndX, y);
      ctx.stroke();
    }
    ctx.restore();
  };
}
