/**
 * Step 2: 量子化（要件§9）。
 *
 * 学習目標: 振幅を段階的な値へ丸めることを理解する。
 *
 * 情報量を絞り、注目してほしい一点だけを見せる。
 * 既定の表示はサンプル点(●)・量子化レベルの横線・量子化点(○)のみ。
 *
 * 「量子化を実行」ボタンを押すと:
 *   フェーズA: 量子化レベルの横線が現れる（丸める先の候補が見える）
 *   フェーズB: サンプル点が最も近い横線（量子化レベル）へ吸い付くように動く
 *
 * 誤差線・復元波形（階段）・元波形はチェックボックスで追加表示できる。
 */
import { useEffect, useMemo, useState } from 'react';
import { useDigitization } from '../context/DigitizationContext';
import { usePlayback } from '../hooks/usePlayback';
import { useRunAnimation } from '../hooks/useRunAnimation';
import { downsample } from '../math/sampling';
import { quantize, quantizationLevels } from '../math/quantization';
import { clamp01 } from '../math/interpolation';
import type { AudioSignal } from '../types/audio';
import type { Renderer } from '../types/render';

import { PageLayout } from '../components/PageLayout';
import { ControlPanel } from '../components/ControlPanel';
import { Slider } from '../components/Slider';
import { PlayButton } from '../components/PlayButton';
import { RunButton } from '../components/RunButton';
import { LayerToggles } from '../components/LayerToggles';
import type { ToggleItem } from '../components/LayerToggles';
import { ViewportControl } from '../components/ViewportControl';
import { SharedWaveCanvas } from '../components/SharedWaveCanvas';

import { renderBackground } from '../visualization/BackgroundRenderer';
import { renderCenterAxis, makeQuantizationGridRenderer } from '../visualization/GridRenderer';
import { makeOriginalWaveRenderer } from '../visualization/WaveRenderer';
import { makeSamplingPointRenderer } from '../visualization/SamplingPointRenderer';
import { makeQuantizationRenderer } from '../visualization/QuantizationRenderer';
import { makeReconstructedWaveRenderer } from '../visualization/ReconstructedWaveRenderer';
import { renderTimeAxis } from '../visualization/TimeAxisRenderer';
import { makeQuantizationAxisRenderer } from '../visualization/QuantizationAxisRenderer';
import { theme } from '../visualization/theme';

/** 吸着アニメーションの長さ [秒]。 */
const ANIM_DURATION = 1.2;

export function Step2Quantization() {
  const { originalSignal, signalId, params, setBitDepth, viewport, setViewport } =
    useDigitization();
  const { isPlaying, play } = usePlayback();

  // ビット数・周波数・音源が変わると idle に戻る。
  const anim = useRunAnimation(ANIM_DURATION, `${params.sampleRate}-${params.bitDepth}-${signalId}`);
  const { phase, progress } = anim;

  // 追加表示のON/OFF。
  const [showErrorLines, setShowErrorLines] = useState(false);
  const [showReconstructed, setShowReconstructed] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  // サンプリング点・測定線は、はじめは表示（Step1からの引き継ぎを見せる）。
  const [showSamplePoints, setShowSamplePoints] = useState(true);
  const [showDropLines, setShowDropLines] = useState(true);

  // アニメーション完了時、サンプリング点と測定線のチェックを自動でOFFにする。
  // 見た目は下記 sampleOpacity で既にフェードアウト済みなので、ここで消えても
  // 一瞬で消える違和感はない。再表示はチェックボックスで可能。
  useEffect(() => {
    if (phase === 'done') {
      setShowSamplePoints(false);
      setShowDropLines(false);
    }
  }, [phase]);

  // ビット数・周波数・音源を変えたら実行前状態へ戻す:
  // サンプリング点・測定線のみ表示し、他のチェックボックスはOFFに戻す。
  useEffect(() => {
    setShowSamplePoints(true);
    setShowDropLines(true);
    setShowErrorLines(false);
    setShowReconstructed(false);
    setShowOriginal(false);
  }, [params.sampleRate, params.bitDepth, signalId]);

  // サンプリング点（Step1の結果を引き継ぐ）。
  const samplePoints = useMemo(
    () => downsample(originalSignal, params.sampleRate),
    [originalSignal, params.sampleRate],
  );
  // 各サンプル点を量子化。
  const quantized = useMemo(
    () => samplePoints.map((p) => quantize(p.amplitude, params.bitDepth)),
    [samplePoints, params.bitDepth],
  );

  // 量子化後の音。
  const quantizedSignal: AudioSignal = useMemo(
    () => ({
      data: Float32Array.from(quantized, (q) => q.amplitude),
      sampleRate: params.sampleRate,
      duration: originalSignal.duration,
    }),
    [quantized, params.sampleRate, originalSignal.duration],
  );
  // 復元波形(階段)用の点列。
  const stairPoints = useMemo(
    () => samplePoints.map((p, i) => ({ timeSec: p.timeSec, amplitude: quantized[i].amplitude })),
    [samplePoints, quantized],
  );

  // --- アニメーション進捗をレイヤー状態へ変換 ---
  // 点の吸着進捗（0=元位置, 1=量子化レベル）。
  // 横線は画面遷移時から常に表示するので、move（点の動き）だけをアニメする。
  const move = phase === 'idle' ? 0 : phase === 'done' ? 1 : progress;

  // サンプリング点・測定線のフェードアウト不透明度。
  // 吸着が進んだ後半（FADE_START〜1）でジワーッと 1→0 にする（running 中のみ）。
  // done のときは 1 に戻す。完了時はチェックが自動OFFされて消えるが、
  // ユーザーがチェックを入れ直したら不透明度1で再表示されるようにするため。
  const FADE_START = 0.6;
  const sampleOpacity =
    phase === 'running' ? 1 - clamp01((progress - FADE_START) / (1 - FADE_START)) : 1;

  // 量子化点（○）は実行ボタンを押すまで表示しない。
  const showQuantPoints = phase !== 'idle';

  // 段数が線として表示できる範囲かどうか（多すぎる場合はグリッド非表示）。
  const gridDrawable = quantizationLevels(params.bitDepth) <= 64;

  const layers = useMemo<Renderer[]>(() => {
    const list: Renderer[] = [renderBackground, renderTimeAxis, renderCenterAxis];

    // 元波形（任意）。
    if (showOriginal) list.push(makeOriginalWaveRenderer(0.5));

    // 量子化レベルの横線。画面遷移時から常に表示（reveal=1）。
    list.push(makeQuantizationGridRenderer(params.bitDepth, 1));

    // 復元波形（階段, 任意）。
    if (showReconstructed) list.push(makeReconstructedWaveRenderer(stairPoints));

    // Step1で取得したサンプル点（●黄）と測定線（チェックボックスで切替）。
    // 吸着アニメ後半で sampleOpacity が 1→0 になりジワーッと消える。
    if ((showSamplePoints || showDropLines) && sampleOpacity > 0) {
      list.push(
        makeSamplingPointRenderer(samplePoints, {
          reveal: 1,
          showPoints: showSamplePoints,
          showDropLines,
          opacity: sampleOpacity,
        }),
      );
    }

    // 量子化点（○）が横線へ吸着する。実行後のみ表示。誤差線は任意。
    if (showQuantPoints) {
      list.push(
        makeQuantizationRenderer(samplePoints, quantized, {
          move,
          showErrorLines,
          showSamplePoints: false,
        }),
      );
    }

    // 量子化レベルの縦軸ラベル（番号）。
    // グリッド線（横線）の表示有無に関わらず常に描く。多いときは間引かれる。
    list.push(makeQuantizationAxisRenderer(params.bitDepth));
    return list;
  }, [
    showOriginal,
    params.bitDepth,
    showReconstructed,
    stairPoints,
    samplePoints,
    quantized,
    move,
    showErrorLines,
    showQuantPoints,
    showSamplePoints,
    showDropLines,
    sampleOpacity,
  ]);

  // 実行時はサンプリング点・測定線を再表示してから吸着アニメを始める。
  // （前回の実行で done のときに自動OFFされているため、ここで戻す）
  const handleRun = () => {
    setShowSamplePoints(true);
    setShowDropLines(true);
    anim.run();
  };

  const toggles: ToggleItem[] = [
    { key: 'samplePoints', label: 'サンプリング点', color: theme.samplePoint, checked: showSamplePoints, disabled: phase === 'running' },
    { key: 'dropLines', label: '測定線', color: theme.samplePoint, checked: showDropLines, disabled: phase === 'running' },
    { key: 'error', label: '量子化誤差（赤線）', color: theme.errorLine, checked: showErrorLines, disabled: phase === 'running' },
    { key: 'recon', label: '復元波形（階段）', color: theme.reconstructed, checked: showReconstructed, disabled: phase === 'running' },
    { key: 'original', label: '元の波形', color: theme.originalWave, checked: showOriginal, disabled: phase === 'running' },
  ];
  const handleToggle = (key: string, checked: boolean) => {
    if (key === 'samplePoints') setShowSamplePoints(checked);
    if (key === 'dropLines') setShowDropLines(checked);
    if (key === 'error') setShowErrorLines(checked);
    if (key === 'recon') setShowReconstructed(checked);
    if (key === 'original') setShowOriginal(checked);
  };

  return (
    <PageLayout
      note="「量子化を実行」を押すと、まず丸める先の候補（量子化レベルの横線）が現れ、次に各サンプル点が最も近い横線へ吸い付きます。ビット数を減らすと横線が粗くなり、元の値とのズレ（量子化誤差）が大きくなります。"
      canvas={<SharedWaveCanvas layers={layers} original={originalSignal} viewport={viewport} />}
      controls={
        <ControlPanel>
          <Slider
            label="量子化ビット数"
            value={params.bitDepth}
            min={1}
            max={16}
            step={1}
            format={(v) => `${v} bit（${2 ** v} 段階）`}
            onChange={setBitDepth}
          />
          {!gridDrawable && (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              ※ 段数が多すぎるため横線は省略されます（点の動きで量子化を確認してください）
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <RunButton phase={phase} label="量子化を実行" onRun={handleRun} />
            <PlayButton
              label="量子化後の音を再生"
              isPlaying={isPlaying}
              onClick={() => play(quantizedSignal)}
            />
          </div>
          <ViewportControl viewport={viewport} onChange={setViewport} signal={originalSignal} />
        </ControlPanel>
      }
      belowGraph={<LayerToggles items={toggles} onChange={handleToggle} />}
    />
  );
}
