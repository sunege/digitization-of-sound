/**
 * 全波形のミニマップ（オーバービュー）。
 *
 * 音声全体の波形を横長に表示し、現在の表示範囲(viewport)を
 * 半透明の矩形（ウィンドウ）で示す。ウィンドウをドラッグ、または
 * 波形上をクリックすると表示位置(startSec)が動く。
 * （表示位置スライダーの代わり。拡大率は別途スライダーで変える。）
 */
import { useEffect, useRef } from 'react';
import type { AudioSignal, Viewport } from '../types/audio';
import { useElementWidth } from '../hooks/useElementWidth';
import { theme } from '../visualization/theme';
import styles from './WaveformOverview.module.css';

interface Props {
  signal: AudioSignal;
  viewport: Viewport;
  onChange: (v: Viewport) => void;
  height?: number;
}

export function WaveformOverview({ signal, viewport, onChange, height = 64 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  // ドラッグ中フラグ（ウィンドウ内をつかんで動かしている間 true）。
  const draggingRef = useRef(false);

  // 時刻[秒] → ミニマップ上のx[px]。全体(0〜duration)を幅いっぱいに対応。
  const timeToX = (t: number) => (t / signal.duration) * width;
  // x[px] → 時刻[秒]。
  const xToTime = (x: number) => (x / width) * signal.duration;

  // 描画。
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

    // 背景。
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    // 全波形（min/max を列ごとに集約して描く）。
    const { data } = signal;
    const samplesPerPx = data.length / width;
    ctx.strokeStyle = theme.originalWave;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let px = 0; px < width; px++) {
      const start = Math.floor(px * samplesPerPx);
      const end = Math.min(data.length, Math.floor((px + 1) * samplesPerPx));
      let min = 1;
      let max = -1;
      for (let i = start; i < end; i++) {
        if (data[i] < min) min = data[i];
        if (data[i] > max) max = data[i];
      }
      if (start >= end) {
        min = max = 0;
      }
      // 振幅 [-1,1] を縦中央基準でピクセルへ。
      const yMax = height / 2 - (max * height) / 2;
      const yMin = height / 2 - (min * height) / 2;
      ctx.moveTo(px + 0.5, yMax);
      ctx.lineTo(px + 0.5, yMin);
    }
    ctx.stroke();

    // 現在の表示範囲ウィンドウ。
    const winX = timeToX(viewport.startSec);
    const winW = Math.max(2, timeToX(viewport.spanSec)); // 細すぎないよう最小幅
    // 範囲外を薄暗くする。
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, winX, height);
    ctx.fillRect(winX + winW, 0, width - (winX + winW), height);
    // ウィンドウ枠＋ハンドル色。
    ctx.strokeStyle = theme.samplePoint;
    ctx.lineWidth = 2;
    ctx.strokeRect(winX, 1, winW, height - 2);
  }, [width, height, signal, viewport]);

  // ウィンドウの中心が x になるよう startSec を更新（範囲内にクランプ）。
  const moveWindowTo = (centerX: number) => {
    const centerTime = xToTime(centerX);
    let start = centerTime - viewport.spanSec / 2;
    const maxStart = Math.max(0, signal.duration - viewport.spanSec);
    start = Math.min(Math.max(0, start), maxStart);
    onChange({ ...viewport, startSec: start });
  };

  const localX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    return clientX - canvas.getBoundingClientRect().left;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    moveWindowTo(localX(e.clientX)); // クリック位置を中心に移動
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    moveWindowTo(localX(e.clientX));
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: '100%', height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
