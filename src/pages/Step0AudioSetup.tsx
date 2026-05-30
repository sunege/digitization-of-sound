/**
 * Step 0: 音の設定（要件§7）。
 *
 * 学習目標: 音が連続的な波であることを理解する。
 * 音源を選び、滑らかな元波形を観察し、元音声を再生できる。
 */
import { useMemo, useState } from 'react';
import { useDigitization } from '../context/DigitizationContext';
import { usePlayback } from '../hooks/usePlayback';
import {
  synthesize,
  DEFAULT_DURATION,
  PITCH_RATIO_MIN,
  PITCH_RATIO_MAX,
} from '../audio/synth';
import { recordMic } from '../audio/recorder';
import type { SourceType } from '../types/audio';

import { PageLayout } from '../components/PageLayout';
import { ControlPanel } from '../components/ControlPanel';
import { SourceSelector } from '../components/SourceSelector';
import { Slider } from '../components/Slider';
import { PlayButton } from '../components/PlayButton';
import { ViewportControl } from '../components/ViewportControl';
import { Legend } from '../components/Legend';
import { SharedWaveCanvas } from '../components/SharedWaveCanvas';

import { renderBackground } from '../visualization/BackgroundRenderer';
import { renderCenterAxis } from '../visualization/GridRenderer';
import { renderOriginalWave } from '../visualization/WaveRenderer';
import { renderTimeAxis } from '../visualization/TimeAxisRenderer';
import { theme } from '../visualization/theme';

export function Step0AudioSetup() {
  const {
    sourceType,
    setSourceType,
    originalSignal,
    setOriginalSignal,
    pitchRatio,
    setPitchRatio,
    viewport,
    setViewport,
  } = useDigitization();
  const { isPlaying, play } = usePlayback();
  const [recording, setRecording] = useState(false);

  // 音源を選び直したら信号を作り直す（現在のピッチで合成）。
  const handleSelect = async (s: SourceType) => {
    setSourceType(s);
    if (s === 'mic') {
      try {
        setRecording(true);
        const recorded = await recordMic(DEFAULT_DURATION);
        setOriginalSignal(recorded);
      } catch {
        // 許可されなかった等。正弦波へフォールバック。
        setSourceType('sine');
        setOriginalSignal(synthesize('sine', DEFAULT_DURATION, pitchRatio));
      } finally {
        setRecording(false);
      }
    } else {
      setOriginalSignal(synthesize(s, DEFAULT_DURATION, pitchRatio));
    }
  };

  // ピッチ変更時、合成音源なら新しいピッチで作り直す（マイク録音には適用しない）。
  const handlePitchChange = (r: number) => {
    setPitchRatio(r);
    if (sourceType !== 'mic') {
      setOriginalSignal(synthesize(sourceType, DEFAULT_DURATION, r));
    }
  };

  // 背景→時間軸→中央軸→元波形 の順に重ねる。
  const layers = useMemo(
    () => [renderBackground, renderTimeAxis, renderCenterAxis, renderOriginalWave],
    [],
  );

  return (
    <PageLayout
      note="なめらかに上下する曲線が「アナログ波形」です。空気の振動がそのまま連続的な値になっています。表示位置や拡大を変えて波の形を観察してみましょう。"
      canvas={
        <SharedWaveCanvas layers={layers} original={originalSignal} viewport={viewport} />
      }
      belowGraph={<Legend items={[{ color: theme.originalWave, label: '元の波形（アナログ）' }]} />}
      controls={
        <ControlPanel>
          <SourceSelector value={sourceType} onSelect={handleSelect} recording={recording} />
          {sourceType !== 'mic' && sourceType !== 'noise' && (
            <Slider
              label="ピッチ（音の高さ）"
              value={pitchRatio}
              min={PITCH_RATIO_MIN}
              max={PITCH_RATIO_MAX}
              step={0.05}
              format={(v) => `×${v.toFixed(2)}`}
              onChange={handlePitchChange}
            />
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <PlayButton
              label="元の音を再生"
              isPlaying={isPlaying}
              onClick={() => play(originalSignal)}
            />
          </div>
          <ViewportControl viewport={viewport} onChange={setViewport} signal={originalSignal} />
        </ControlPanel>
      }
    />
  );
}
