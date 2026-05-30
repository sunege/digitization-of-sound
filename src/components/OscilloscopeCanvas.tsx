/**
 * マイク入力のリアルタイム波形（オシロスコープ）Canvas。
 *
 * 録音待機中・録音中に、AnalyserNode から取り出した現在の波形を
 * 毎フレーム描き直す。描画自体は SharedWaveCanvas と同じレイヤー方式
 * （背景→中心線→波形）だが、こちらは rAF で常時更新する点が異なる。
 */
import { useRef } from 'react';
import type { Viewport, AudioSignal } from '../types/audio';
import type { RenderContext } from '../types/render';
import { createMapper } from '../visualization/coords';
import { useElementWidth } from '../hooks/useElementWidth';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { renderBackground } from '../visualization/BackgroundRenderer';
import { renderCenterAxis } from '../visualization/GridRenderer';
import { makeOscilloscopeRenderer } from '../visualization/OscilloscopeRenderer';
import type { MicRecorder } from '../audio/recorder';
import styles from './OscilloscopeCanvas.module.css';

interface Props {
  recorder: MicRecorder;
  viewport: Viewport;
  /** 左上に表示する状態ラベル（例: 「録音待機中」「● 録音中」）。 */
  label?: string;
  height?: number;
}

/** ampToY 用のダミー信号（オシロスコープは渡された波形配列を直接描くため未使用）。 */
const DUMMY_SIGNAL: AudioSignal = { data: new Float32Array(0), sampleRate: 1, duration: 0 };

export function OscilloscopeCanvas({ recorder, viewport, label, height = 340 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  // 波形の読み出し先バッファ（毎フレーム使い回す）。
  const bufRef = useRef<Float32Array>(new Float32Array(recorder.frameSize));

  useAnimationFrame(() => {
    if (!width) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 高解像度対応（サイズ変化時のみ再設定）。
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 現在の波形を取得して描画。
    const buf = bufRef.current;
    recorder.getWaveform(buf);

    const mapper = createMapper(viewport, width, height);
    const rc: RenderContext = { ctx, mapper, viewport, original: DUMMY_SIGNAL };
    renderBackground(rc);
    renderCenterAxis(rc);
    makeOscilloscopeRenderer(buf)(rc);
  }, true);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} style={{ width: '100%', height }} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
