/**
 * Step 1: サンプリング（標本化）（要件§8）。
 *
 * 学習目標: 音を時間方向に離散化することを理解する。
 *
 * 「標本化を実行」ボタンを押すと、段階的なアニメーションで何をしているかを見せる:
 *   フェーズA: グリッド線とサンプル点が左→右へ順番に現れる（測定している感）
 *   フェーズB: 全サンプルを取り終えたら、元波形を薄くフェードアウトし、
 *             サンプル点だけが残る（「点に置き換わった」ことに注目させる）
 *
 * 元波形などの表示要素はチェックボックスでON/OFFできる。
 */
import { useEffect, useMemo, useState } from 'react';
import { useDigitization } from '../context/DigitizationContext';
import { usePlayback } from '../hooks/usePlayback';
import { useRunAnimation } from '../hooks/useRunAnimation';
import { downsample } from '../math/sampling';
import { clamp01 } from '../math/interpolation';
import { formatHz } from '../utils/format';
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
import { renderCenterAxis, makeSamplingGridRenderer } from '../visualization/GridRenderer';
import { makeOriginalWaveRenderer } from '../visualization/WaveRenderer';
import { makeSamplingPointRenderer } from '../visualization/SamplingPointRenderer';
import { renderTimeAxis } from '../visualization/TimeAxisRenderer';
import { theme } from '../visualization/theme';

/** サンプリング周波数の範囲（100Hz刻み）。下限400Hz〜上限44100Hz。 */
const SAMPLE_RATE_MIN = 400;
const SAMPLE_RATE_MAX = 44100;
const SAMPLE_RATE_STEP = 100;

/** サンプリングアニメーションの長さ [秒]（左→右の出現をゆっくり見せる）。 */
const ANIM_DURATION = 4.0;
/**
 * アニメーションの内訳。
 * 0.0〜0.75: グリッド/点が左→右に出現（measure）
 * 0.75〜1.0: 元波形がフェードアウト（fade）
 */
const FADE_START = 0.75;

export function Step1Sampling() {
  const { originalSignal, signalId, params, setSampleRate, viewport, setViewport } =
    useDigitization();
  const { isPlaying, play } = usePlayback();

  // 実行ボタンで起動するアニメーション。周波数/音源が変わると idle に戻る。
  const anim = useRunAnimation(ANIM_DURATION, `${params.sampleRate}-${signalId}`);

  // 表示要素のON/OFF（チェックボックス）。
  const [showOriginal, setShowOriginal] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showDropLines, setShowDropLines] = useState(true);

  // サンプリング点を計算（単純間引き）。
  const samplePoints = useMemo(
    () => downsample(originalSignal, params.sampleRate),
    [originalSignal, params.sampleRate],
  );

  // サンプリング後の音（点の振幅を targetRate の信号として再生）。
  const sampledSignal: AudioSignal = useMemo(
    () => ({
      data: Float32Array.from(samplePoints, (p) => p.amplitude),
      sampleRate: params.sampleRate,
      duration: originalSignal.duration,
    }),
    [samplePoints, params.sampleRate, originalSignal.duration],
  );

  // --- アニメーション進捗を各レイヤーの状態へ変換 ---
  const { phase, progress } = anim;
  // 出現の進捗（measure 区間を 0→1 に正規化）。
  const reveal = phase === 'idle' ? 0 : clamp01(progress / FADE_START);
  // 元波形フェードの進捗（fade 区間を 0→1 に正規化）。
  const fadeT = phase === 'idle' ? 0 : clamp01((progress - FADE_START) / (1 - FADE_START));

  // 完了したら元波形チェックを自動OFF（要件の方針）。再表示はユーザー操作で可能。
  useEffect(() => {
    if (phase === 'done') setShowOriginal(false);
  }, [phase]);

  // 周波数スライダーや音源を変えたら実行前状態へ戻す:
  // 元波形を再表示し、サンプリング点は phase=idle により自動的に非表示になる。
  useEffect(() => {
    setShowOriginal(true);
  }, [params.sampleRate, signalId]);

  // 元波形の不透明度。
  //   - チェックOFF: 0
  //   - 実行中: fade 区間で 1→0
  //   - それ以外(idle/done でON): 1
  let originalOpacity = 0;
  if (showOriginal) {
    originalOpacity = phase === 'running' ? 1 - fadeT : 1;
  }
  // サンプル点の表示割合。
  //   - idle   : 0（まだ標本化していないので非表示）
  //   - running: reveal（左→右に出現）
  //   - done   : 1（全点表示）
  const pointReveal = phase === 'idle' ? 0 : phase === 'done' ? 1 : reveal;

  // レイヤー構成（背景→グリッド→中央軸→元波形→サンプル点）。
  // グリッドは画面遷移時から常に表示（reveal=1）。動くのはサンプル点だけ。
  const layers = useMemo<Renderer[]>(() => {
    const list: Renderer[] = [renderBackground, renderTimeAxis];
    if (showGrid) {
      list.push(makeSamplingGridRenderer(params.sampleRate, 1));
    }
    list.push(renderCenterAxis);
    if (originalOpacity > 0) {
      list.push(makeOriginalWaveRenderer(originalOpacity));
    }
    list.push(makeSamplingPointRenderer(samplePoints, { reveal: pointReveal, showDropLines }));
    return list;
  }, [showGrid, params.sampleRate, originalOpacity, samplePoints, pointReveal, showDropLines]);

  // 実行開始時は元波形を見せておく（フェードアウトを見せるため）。
  const handleRun = () => {
    setShowOriginal(true);
    anim.run();
  };

  const toggles: ToggleItem[] = [
    { key: 'original', label: '元の波形', color: theme.originalWave, checked: showOriginal, disabled: phase === 'running' },
    { key: 'grid', label: 'サンプリング格子', checked: showGrid, disabled: phase === 'running' },
    { key: 'drop', label: '測定線（縦線）', color: theme.samplePoint, checked: showDropLines, disabled: phase === 'running' },
  ];
  const handleToggle = (key: string, checked: boolean) => {
    if (key === 'original') setShowOriginal(checked);
    if (key === 'grid') setShowGrid(checked);
    if (key === 'drop') setShowDropLines(checked);
  };

  return (
    <PageLayout
      note="「標本化を実行」を押すと、一定間隔ごとに波の高さを測り、点に置き換えていく様子が見えます。測り終えると元の波が消え、点だけが残ります。周波数を下げると点が粗くなり、元の波の細かい変化を拾えなくなります。"
      canvas={<SharedWaveCanvas layers={layers} original={originalSignal} viewport={viewport} />}
      controls={
        <ControlPanel>
          <Slider
            label="サンプリング周波数"
            value={params.sampleRate}
            min={SAMPLE_RATE_MIN}
            max={SAMPLE_RATE_MAX}
            step={SAMPLE_RATE_STEP}
            format={formatHz}
            onChange={setSampleRate}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <RunButton phase={phase} label="標本化を実行" onRun={handleRun} />
            <PlayButton
              label="サンプリング後の音を再生"
              isPlaying={isPlaying}
              onClick={() => play(sampledSignal)}
            />
          </div>
          <ViewportControl viewport={viewport} onChange={setViewport} signal={originalSignal} />
        </ControlPanel>
      }
      belowGraph={<LayerToggles items={toggles} onChange={handleToggle} />}
    />
  );
}
