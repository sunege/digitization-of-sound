/**
 * Step 3: 符号化（要件§10）。
 *
 * 学習目標: 量子化値が0と1へ変換されることを理解する。
 *
 * Step2で量子化したグラフをそのまま表示し、表示区間内の点を符号化する。
 * 「符号化を実行」で左→右に自動変換、または点を直接クリックして1つずつ変換できる。
 * 変換した分だけ、グラフ下部にビット列が積み上がっていく。
 *
 * データサイズ（周波数・ビット数・再生時間・推定サイズ）は常時表示。
 */
import { useMemo } from 'react';
import { useDigitization } from '../context/DigitizationContext';
import { usePlayback } from '../hooks/usePlayback';
import { useEncodingProgress } from '../hooks/useEncodingProgress';
import { usePulse } from '../hooks/usePulse';
import { downsample } from '../math/sampling';
import { quantize } from '../math/quantization';
import { dataSizeBytes } from '../math/dataSize';
import { formatHz, formatBytes, formatSeconds } from '../utils/format';
import type { AudioSignal } from '../types/audio';
import type { Renderer } from '../types/render';

import { PageLayout } from '../components/PageLayout';
import { ControlPanel } from '../components/ControlPanel';
import { PlayButton } from '../components/PlayButton';
import { RunButton } from '../components/RunButton';
import { ViewportControl } from '../components/ViewportControl';
import { EncodingCanvas } from '../components/EncodingCanvas';
import { BitStream } from '../components/BitStream';
import styles from './Step3Encoding.module.css';

import { renderBackground } from '../visualization/BackgroundRenderer';
import { renderCenterAxis, makeQuantizationGridRenderer } from '../visualization/GridRenderer';
import { renderTimeAxis } from '../visualization/TimeAxisRenderer';
import { makeQuantizationAxisRenderer } from '../visualization/QuantizationAxisRenderer';
import { makeEncodingPointRenderer } from '../visualization/EncodingPointRenderer';

/** 1点あたりの自動変換時間 [秒]。 */
const PER_POINT_SEC = 0.25;

export function Step3Encoding() {
  const { originalSignal, signalId, params, viewport, setViewport } = useDigitization();
  const { isPlaying, play } = usePlayback();

  // サンプリング→量子化（Step1/2の設定を引き継ぐ）。
  const allSamples = useMemo(
    () => downsample(originalSignal, params.sampleRate),
    [originalSignal, params.sampleRate],
  );
  const allQuantized = useMemo(
    () => allSamples.map((p) => quantize(p.amplitude, params.bitDepth)),
    [allSamples, params.bitDepth],
  );

  // 表示区間（ビューポート）内の点だけを符号化対象にする。
  const endSec = viewport.startSec + viewport.spanSec;
  const visible = useMemo(() => {
    const samples = [];
    const quantized = [];
    for (let i = 0; i < allSamples.length; i++) {
      const t = allSamples[i].timeSec;
      if (t >= viewport.startSec && t <= endSec) {
        samples.push(allSamples[i]);
        quantized.push(allQuantized[i]);
      }
    }
    return { samples, quantized };
  }, [allSamples, allQuantized, viewport.startSec, endSec]);

  const levels = useMemo(() => visible.quantized.map((q) => q.levelIndex), [visible.quantized]);

  // 符号化の進行（表示区間・パラメータが変わると 0個に戻る）。
  const enc = useEncodingProgress(
    visible.samples.length,
    PER_POINT_SEC,
    `${params.sampleRate}-${params.bitDepth}-${signalId}-${viewport.startSec}-${viewport.spanSec}`,
  );

  // 「次に変換する点」の点滅（実行中でなく、未完了のときだけ）。
  const pulseActive = !enc.running && !enc.done && visible.samples.length > 0;
  const pulse = usePulse(1.1, pulseActive);

  // データサイズ計算（信号全体に対して。表示区間に依存しない）。
  const bytes = dataSizeBytes({
    sampleRate: params.sampleRate,
    bitDepth: params.bitDepth,
    channels: params.channels,
    duration: originalSignal.duration,
  });

  // デジタル化後の音（量子化値を再生）。
  const digitizedSignal: AudioSignal = useMemo(
    () => ({
      data: Float32Array.from(allQuantized, (q) => q.amplitude),
      sampleRate: params.sampleRate,
      duration: originalSignal.duration,
    }),
    [allQuantized, params.sampleRate, originalSignal.duration],
  );

  // グラフのレイヤー（Step2の量子化グラフを踏襲＋符号化状態）。
  const layers = useMemo<Renderer[]>(
    () => [
      renderBackground,
      renderTimeAxis,
      renderCenterAxis,
      makeQuantizationGridRenderer(params.bitDepth, 1),
      makeEncodingPointRenderer({
        samples: visible.samples,
        quantized: visible.quantized,
        encodedCount: enc.encodedCount,
        highlightNext: pulseActive,
        pulse,
      }),
      makeQuantizationAxisRenderer(params.bitDepth),
    ],
    [params.bitDepth, visible, enc.encodedCount, pulseActive, pulse],
  );

  // クリックされた点（index）まで一気に変換する。
  const handlePointClick = (index: number) => {
    enc.encodeUpTo(index + 1);
  };

  return (
    <PageLayout
      note="量子化した点を、ビット数ぶんの 0 と 1（2進数）へ変換します。「符号化を実行」で左から順に変換され、点を直接クリックしても1つずつ変換できます。下にビット列（コンピュータの中の音のデータ）が積み上がります。"
      canvas={
        <div className={styles.graphArea}>
          <EncodingCanvas
            layers={layers}
            original={originalSignal}
            viewport={viewport}
            points={visible.samples}
            onPointClick={handlePointClick}
          />
          <BitStream levels={levels} bitDepth={params.bitDepth} encodedCount={enc.encodedCount} />
        </div>
      }
      controls={
        <ControlPanel>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <RunButton
              phase={enc.running ? 'running' : enc.done ? 'done' : 'idle'}
              label="符号化を実行"
              onRun={enc.run}
            />
            <PlayButton label="元の音" isPlaying={isPlaying} onClick={() => play(originalSignal)} />
            <PlayButton
              label="デジタル化後の音"
              variant="secondary"
              isPlaying={isPlaying}
              onClick={() => play(digitizedSignal)}
            />
          </div>
          <ViewportControl viewport={viewport} onChange={setViewport} signal={originalSignal} />
          <div className={styles.stats}>
            <Stat label="サンプリング周波数" value={formatHz(params.sampleRate)} />
            <Stat label="量子化ビット数" value={`${params.bitDepth} bit`} />
            <Stat label="再生時間" value={formatSeconds(originalSignal.duration)} />
            <Stat label="推定データサイズ" value={formatBytes(bytes)} highlight />
          </div>
          <p className={styles.formula}>データ量 = 周波数 × ビット数 × チャンネル数 × 再生時間</p>
        </ControlPanel>
      }
    />
  );
}

/** 統計1項目の表示。 */
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${styles.stat} ${highlight ? styles.statHighlight : ''}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
