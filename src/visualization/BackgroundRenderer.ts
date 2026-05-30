/**
 * 背景レイヤー。最初に全面を塗りつぶす（要件§12.1 レイヤー1）。
 */
import type { Renderer } from '../types/render';
import { theme } from './theme';

export const renderBackground: Renderer = ({ ctx, mapper }) => {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, mapper.width, mapper.height);
};
