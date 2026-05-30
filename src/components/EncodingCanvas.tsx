/**
 * Step3 用のクリック可能な波形Canvas。
 *
 * SharedWaveCanvas と同じくレイヤー配列を描画するが、
 * クリック位置から最も近い「対象点」を探して onPointClick で通知する。
 * これにより、点を直接クリックして符号化を進める操作を実現する。
 *
 * 幅はコンテナに追従、高さは固定（SharedWaveCanvas と同方針）。
 */
import { useEffect, useRef } from 'react';
import type { AudioSignal, Viewport } from '../types/audio';
import type { Renderer, RenderContext } from '../types/render';
import type { SamplePoint } from '../math/sampling';
import { createMapper } from '../visualization/coords';
import { useElementWidth } from '../hooks/useElementWidth';
import styles from './SharedWaveCanvas.module.css';

interface Props {
  layers: Renderer[];
  original: AudioSignal;
  viewport: Viewport;
  /** クリック判定の対象点（時刻昇順）。 */
  points: SamplePoint[];
  /** 点がクリックされたとき、その配列インデックスを返す。 */
  onPointClick: (index: number) => void;
  height?: number;
}

/** クリックを点と見なす最大距離 [px]。 */
const CLICK_TOLERANCE = 18;

export function EncodingCanvas({
  layers,
  original,
  viewport,
  points,
  onPointClick,
  height = 340,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();

  useEffect(() => {
    if (!width) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mapper = createMapper(viewport, width, height);
    const rc: RenderContext = { ctx, mapper, viewport, original };
    for (const layer of layers) layer(rc);
  }, [layers, original, viewport, width, height]);

  // クリック位置 → 最も近い点を探す（x方向の距離で判定）。
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    const mapper = createMapper(viewport, width, height);
    let nearest = -1;
    let nearestDist = CLICK_TOLERANCE;
    for (let i = 0; i < points.length; i++) {
      const x = mapper.timeToX(points[i].timeSec);
      const dist = Math.abs(x - clickX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }
    if (nearest >= 0) onPointClick(nearest);
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: '100%', height, cursor: 'pointer' }}
        onClick={handleClick}
      />
    </div>
  );
}
