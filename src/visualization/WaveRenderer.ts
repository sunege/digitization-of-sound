/**
 * 元波形レイヤー（要件§12.1 レイヤー3）。
 *
 * 高密度サンプル(BASE_SAMPLE_RATE)を滑らかな線で結び、
 * 「連続的な波(アナログ波形)」として見せる（要件§7.2 滑らかな線）。
 */
import type { Renderer, RenderContext } from '../types/render';
import { theme } from './theme';

/**
 * 元波形を描く renderer を作る。
 * @param opacity 不透明度（0〜1）。サンプリング完了時に波形を薄く/消すのに使う。
 */
export function makeOriginalWaveRenderer(opacity = 1): Renderer {
  return ({ ctx, mapper, viewport, original }: RenderContext) => {
    if (opacity <= 0) return; // 完全透明なら描かない

    const { data, sampleRate } = original;

    const startIndex = Math.max(0, Math.floor(viewport.startSec * sampleRate));
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((viewport.startSec + viewport.spanSec) * sampleRate),
    );

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = theme.originalWave;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = startIndex; i <= endIndex; i++) {
      const t = i / sampleRate;
      const x = mapper.timeToX(t);
      const y = mapper.ampToY(data[i]);
      if (i === startIndex) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  };
}

/** 不透明な元波形（Step0 などそのまま表示する場合の既定）。 */
export const renderOriginalWave: Renderer = makeOriginalWaveRenderer(1);
