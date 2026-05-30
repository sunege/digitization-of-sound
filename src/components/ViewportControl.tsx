/**
 * 波形の拡大表示コントロール（要件§12.2）。
 *
 * - 表示する時間幅(spanSec): スライダーで段階的に変える（ズーム）。
 * - 表示位置(startSec): 全波形ミニマップ上のウィンドウをドラッグして動かす。
 */
import { Slider } from './Slider';
import { WaveformOverview } from './WaveformOverview';
import type { AudioSignal, Viewport } from '../types/audio';
import styles from './ViewportControl.module.css';

interface Props {
  viewport: Viewport;
  onChange: (v: Viewport) => void;
  signal: AudioSignal;
}

/** 選べる時間幅 [秒]（5ms〜200ms）。 */
const SPAN_STEPS = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2];

export function ViewportControl({ viewport, onChange, signal }: Props) {
  return (
    <>
      <Slider
        label="拡大（表示する時間幅）"
        value={viewport.spanSec}
        steps={SPAN_STEPS}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(spanSec) =>
          onChange({
            ...viewport,
            spanSec,
            // ズーム変更で表示窓が末尾を超えないよう開始位置を補正。
            startSec: Math.min(viewport.startSec, Math.max(0, signal.duration - spanSec)),
          })
        }
      />
      <div className={styles.positionField}>
        <span className={styles.label}>表示位置（黄枠をドラッグ）</span>
        <WaveformOverview signal={signal} viewport={viewport} onChange={onChange} />
      </div>
    </>
  );
}
