/**
 * オシロスコープ波形レイヤー（マイクのリアルタイム表示用）。
 *
 * AnalyserNode から得た時間領域サンプル（-1〜+1）を、プロット領域の
 * 横幅いっぱいに左→右で描く。時間軸の絶対位置ではなく「現在の1フレーム」を
 * 表示するため、ビューポートの時刻には依存せず、サンプル番号を等間隔に並べる。
 * 振幅方向は通常の波形と同じ mapper.ampToY（ampScale 反映）で描く。
 */
import type { Renderer, RenderContext } from '../types/render';
import { theme } from './theme';

/**
 * @param samples 時間領域サンプル（analyser.getFloatTimeDomainData の結果）
 */
export function makeOscilloscopeRenderer(samples: Float32Array): Renderer {
  return ({ ctx, mapper }: RenderContext) => {
    const n = samples.length;
    if (n < 2) return;

    const { plotLeft, plotRight } = mapper;
    const plotWidth = plotRight - plotLeft;

    ctx.save();
    ctx.strokeStyle = theme.originalWave;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i < n; i++) {
      const x = plotLeft + (i / (n - 1)) * plotWidth;
      const y = mapper.ampToY(samples[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.restore();
  };
}
