/**
 * Step 0: 音の設定（要件§7）。
 *
 * 学習目標: 音が連続的な波であることを理解する。
 * 音源を選び、滑らかな元波形を観察し、元音声を再生できる。
 */
import { useMemo, useRef, useState } from 'react';
import { useDigitization } from '../context/DigitizationContext';
import { usePlayback } from '../hooks/usePlayback';
import {
  synthesize,
  DEFAULT_DURATION,
  PITCH_RATIO_MIN,
  PITCH_RATIO_MAX,
} from '../audio/synth';
import { prepareMic } from '../audio/recorder';
import type { MicRecorder } from '../audio/recorder';
import type { SourceType } from '../types/audio';

import { PageLayout } from '../components/PageLayout';
import { ControlPanel } from '../components/ControlPanel';
import { SourceSelector } from '../components/SourceSelector';
import type { MicState } from '../components/SourceSelector';
import { Slider } from '../components/Slider';
import { PlayButton } from '../components/PlayButton';
import { ViewportControl } from '../components/ViewportControl';
import { Legend } from '../components/Legend';
import { SharedWaveCanvas } from '../components/SharedWaveCanvas';
import { OscilloscopeCanvas } from '../components/OscilloscopeCanvas';

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
  // マイクは「準備（許可・ウォームアップ）→ 録音」の2段階で扱う。
  const [micState, setMicState] = useState<MicState>('idle');
  const recorderRef = useRef<MicRecorder | null>(null);

  // 音源を選び直したら信号を作り直す（現在のピッチで合成）。
  const handleSelect = async (s: SourceType) => {
    if (s === 'mic') {
      // マイクボタンは状態によって挙動が変わる。
      if (micState === 'idle') {
        // 1段階目: マイクを準備する（許可取得・ウォームアップ開始）。
        setSourceType('mic');
        setMicState('preparing');
        try {
          recorderRef.current = await prepareMic();
          setMicState('armed'); // 準備完了 →「録音開始」待機
        } catch {
          // 許可されなかった等。正弦波へフォールバック。
          recorderRef.current = null;
          setMicState('idle');
          setSourceType('sine');
          setOriginalSignal(synthesize('sine', DEFAULT_DURATION, pitchRatio));
        }
      } else if (micState === 'armed') {
        // 2段階目: 実際に録音する（マイクは既に安定して動いている）。
        setMicState('recording');
        try {
          const recorded = await recorderRef.current!.record(DEFAULT_DURATION);
          setOriginalSignal(recorded);
        } finally {
          await recorderRef.current?.close();
          recorderRef.current = null;
          setMicState('idle');
        }
      }
      // preparing / recording 中のクリックは無視する。
      return;
    }

    // 他の音源を選択: マイク準備中なら開放してから切り替える。
    if (recorderRef.current) {
      await recorderRef.current.close();
      recorderRef.current = null;
    }
    setMicState('idle');
    setSourceType(s);
    setOriginalSignal(synthesize(s, DEFAULT_DURATION, pitchRatio));
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

  // 録音待機中・録音中はマイク入力をオシロスコープ表示する。
  const micLive = micState === 'armed' || micState === 'recording';
  const recorder = recorderRef.current;

  return (
    <PageLayout
      note="なめらかに上下する曲線が「アナログ波形」です。空気の振動がそのまま連続的な値になっています。表示位置や拡大を変えて波の形を観察してみましょう。"
      canvas={
        micLive && recorder ? (
          <OscilloscopeCanvas
            recorder={recorder}
            viewport={viewport}
            label={micState === 'recording' ? '● 録音中' : '録音待機中（マイク入力）'}
          />
        ) : (
          <SharedWaveCanvas layers={layers} original={originalSignal} viewport={viewport} />
        )
      }
      belowGraph={<Legend items={[{ color: theme.originalWave, label: '元の波形（アナログ）' }]} />}
      controls={
        <ControlPanel>
          <SourceSelector value={sourceType} onSelect={handleSelect} micState={micState} />
          {/* ピッチスライダーと再生ボタンを横並びにして縦をコンパクトにする。 */}
          {sourceType !== 'mic' && sourceType !== 'noise' ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <Slider
                label="ピッチ（音の高さ）"
                value={pitchRatio}
                min={PITCH_RATIO_MIN}
                max={PITCH_RATIO_MAX}
                step={0.05}
                format={(v) => `×${v.toFixed(2)}`}
                onChange={handlePitchChange}
              />
              <PlayButton label="再生" isPlaying={isPlaying} onClick={() => play(originalSignal)} />
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PlayButton label="再生" isPlaying={isPlaying} onClick={() => play(originalSignal)} />
            </div>
          )}
          <ViewportControl viewport={viewport} onChange={setViewport} signal={originalSignal} />
        </ControlPanel>
      }
    />
  );
}
