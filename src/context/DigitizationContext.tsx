/**
 * 全Stepで共有するデジタル化の状態（要件§11.3 パラメータ引継ぎ）。
 *
 * - sourceType   : 選択中の音源
 * - originalSignal: 元の音声（連続波形の近似, BASE_SAMPLE_RATE）
 * - signalId     : 信号が更新されるたびに増える番号（アニメ再生のトリガに使う）
 * - params       : サンプリング周波数・量子化ビット数・チャンネル数
 * - viewport     : 波形の表示範囲（拡大表示用）
 *
 * Step を移動しても、これらの設定・データは保持される。
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AudioSignal, DigitizationParams, SourceType, Viewport } from '../types/audio';
import { synthesize, DEFAULT_DURATION } from '../audio/synth';

interface DigitizationState {
  sourceType: SourceType;
  setSourceType: (s: SourceType) => void;

  originalSignal: AudioSignal;
  setOriginalSignal: (s: AudioSignal) => void;
  /** 信号の世代番号。Float32Array を直接比較せずに変更検知するために使う。 */
  signalId: number;

  /** ピッチ倍率（1.0 で標準）。合成音源の高さを変える。 */
  pitchRatio: number;
  setPitchRatio: (r: number) => void;

  params: DigitizationParams;
  setSampleRate: (hz: number) => void;
  setBitDepth: (bit: number) => void;

  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}

const DigitizationContext = createContext<DigitizationState | null>(null);

/** 初期表示範囲。先頭から少しの区間を拡大して点が見えるようにする。 */
const INITIAL_VIEWPORT: Viewport = {
  startSec: 0,
  spanSec: 0.005, // 5ms（数ms単位でサンプリング点・階段状波形がよく見える, 要件§12.2）
  ampScale: 0.9,
};

export function DigitizationProvider({ children }: { children: ReactNode }) {
  const [sourceType, setSourceType] = useState<SourceType>('sine');
  const [originalSignal, setOriginalSignalState] = useState<AudioSignal>(() =>
    synthesize('sine', DEFAULT_DURATION),
  );
  const [signalId, setSignalId] = useState(0);
  const [pitchRatio, setPitchRatio] = useState(1);
  const [params, setParams] = useState<DigitizationParams>({
    sampleRate: 8000,
    bitDepth: 4,
    channels: 1,
  });
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);

  // 信号を差し替えるたびに世代番号を増やす。
  const setOriginalSignal = useCallback((s: AudioSignal) => {
    setOriginalSignalState(s);
    setSignalId((id) => id + 1);
  }, []);

  const value = useMemo<DigitizationState>(
    () => ({
      sourceType,
      setSourceType,
      originalSignal,
      setOriginalSignal,
      signalId,
      pitchRatio,
      setPitchRatio,
      params,
      setSampleRate: (hz) => setParams((p) => ({ ...p, sampleRate: hz })),
      setBitDepth: (bit) => setParams((p) => ({ ...p, bitDepth: bit })),
      viewport,
      setViewport,
    }),
    [sourceType, originalSignal, setOriginalSignal, signalId, pitchRatio, params, viewport],
  );

  return <DigitizationContext.Provider value={value}>{children}</DigitizationContext.Provider>;
}

/** 共有状態を取得するフック。Provider 外で呼ぶとエラー。 */
export function useDigitization(): DigitizationState {
  const ctx = useContext(DigitizationContext);
  if (!ctx) {
    throw new Error('useDigitization は DigitizationProvider の内側で使ってください');
  }
  return ctx;
}
