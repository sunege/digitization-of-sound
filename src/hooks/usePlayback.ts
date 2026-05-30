/**
 * 音声再生フック。
 *
 * 再生中かどうかの状態を持ち、二重再生を防ぐ。
 * 各Stepの「再生ボタン」から使う。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { playSignal } from '../audio/playback';
import type { AudioSignal } from '../types/audio';

export function usePlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    (signal: AudioSignal) => {
      // 再生中なら一度止めてから鳴らす。
      stopRef.current?.();
      setIsPlaying(true);
      stopRef.current = playSignal(signal, () => {
        setIsPlaying(false);
        stopRef.current = null;
      });
    },
    [],
  );

  // アンマウント時に停止。
  useEffect(() => () => stopRef.current?.(), []);

  return { isPlaying, play, stop };
}
