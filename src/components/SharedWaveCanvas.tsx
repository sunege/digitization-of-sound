/**
 * 全Step共通の波形Canvas（要件§18）。
 *
 * 役割は「渡されたレイヤー(renderer)群を順番に描画する」ことだけ。
 * 何を描くか（元波形・サンプリング点・量子化点…）は各Stepが
 * レイヤー配列として渡す。これにより巨大なCanvas関数を避ける（要件§20.2）。
 *
 * アニメーションの進捗は各 renderer のクロージャに埋め込まれているため、
 * このコンポーネントは進捗を一切知らない。layers が変わるたびに描き直すだけ。
 *
 * 幅はコンテナ（カラム）に追従し、高さは固定。これでグラフと操作パネルを
 * 横並びにしても、グラフがカラム幅いっぱいに収まる。
 */
import { useEffect, useRef } from 'react';
import type { AudioSignal, Viewport } from '../types/audio';
import type { Renderer, RenderContext } from '../types/render';
import { createMapper } from '../visualization/coords';
import { useElementWidth } from '../hooks/useElementWidth';
import styles from './SharedWaveCanvas.module.css';

interface Props {
  /** 描画レイヤー（背景→グリッド→波形…の順で渡す）。 */
  layers: Renderer[];
  original: AudioSignal;
  viewport: Viewport;
  /** 高さ [px]（固定）。 */
  height?: number;
}

export function SharedWaveCanvas({ layers, original, viewport, height = 340 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();

  useEffect(() => {
    if (!width) return; // 幅未計測のうちは描かない
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 高解像度ディスプレイ対応（DPRぶん拡大して描画）。
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // CSSピクセル基準で描けるようにする

    const mapper = createMapper(viewport, width, height);
    const rc: RenderContext = { ctx, mapper, viewport, original };

    // レイヤーを順番に描画。
    for (const layer of layers) {
      layer(rc);
    }
  }, [layers, original, viewport, width, height]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} style={{ width: '100%', height }} />
    </div>
  );
}
