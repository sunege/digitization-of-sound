/**
 * 時間軸レイヤー（横軸の時間目盛り）。
 *
 * Canvas下部に時間[ms]の数値ラベルと目盛り線を描く。
 * ビューポート（拡大スライダー）の表示範囲に連動し、
 * 拡大すると細かい間隔、縮小すると粗い間隔の目盛りになる。
 */
import type { Renderer, RenderContext } from '../types/render';
import { theme } from './theme';

/**
 * 「きりのよい」目盛り間隔 [秒] を選ぶ。
 * 1・2・5 × 10^n の系列から、目盛りが約6本になる値を選ぶ。
 *
 * @param spanSec 表示している時間幅 [秒]
 */
function niceTickStep(spanSec: number): number {
  const targetTicks = 6; // おおよそ6分割を目指す
  const rawStep = spanSec / targetTicks; // 理想の間隔
  // rawStep を 1/2/5 × 10^n に丸める。
  const exponent = Math.floor(Math.log10(rawStep));
  const base = 10 ** exponent;
  const fraction = rawStep / base; // 1〜10 の値
  let niceFraction: number;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * base;
}

/** 秒を ms ラベルへ整形（例: 0.012 → "12 ms", 0.0125 → "12.5 ms"）。 */
function formatMs(timeSec: number): string {
  const ms = timeSec * 1000;
  // 整数に近ければ整数、そうでなければ小数1桁。
  const rounded = Math.round(ms * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ms`;
}

/** 時間軸（横軸の目盛り・ラベル）を描く renderer。プロット領域の下マージンに描く。 */
export const renderTimeAxis: Renderer = ({ ctx, mapper, viewport }: RenderContext) => {
  const { startSec, spanSec } = viewport;
  const step = niceTickStep(spanSec);
  const endSec = startSec + spanSec;

  // 目盛りはプロット下端、ラベルはその下（マージン内）に置く。
  const baseY = mapper.plotBottom;

  ctx.save();
  ctx.strokeStyle = theme.axisTick;
  ctx.fillStyle = theme.axisText;
  ctx.lineWidth = 1;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'top';

  // 表示範囲を覆う最初の目盛り時刻（step の倍数）から描き始める。
  const firstTick = Math.ceil(startSec / step) * step;

  for (let t = firstTick; t <= endSec + 1e-9; t += step) {
    const x = mapper.timeToX(t);

    // 目盛り線（プロット下端から下に短く）。
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, baseY + 4);
    ctx.stroke();

    // ラベル。プロット領域からはみ出さないよう左右に寄せる。
    const label = formatMs(t);
    const textWidth = ctx.measureText(label).width;
    let textX = x - textWidth / 2;
    textX = Math.max(mapper.plotLeft, Math.min(textX, mapper.plotRight - textWidth));
    ctx.fillText(label, textX, baseY + 6);
  }

  ctx.restore();
};
