/**
 * 「実行」ボタンで起動するアニメーションを管理するフック。
 *
 * 状態は3つのフェーズを持つ:
 *   - 'idle'   : まだ実行していない（実行前の静止状態）
 *   - 'running': アニメーション再生中（progress が 0→1 へ進む）
 *   - 'done'   : 再生完了（progress = 1 で停止）
 *
 * パラメータ（resetKey）が変わると 'idle' に戻る（要件の方針:
 * スライダーを動かしたら実行前状態に戻し、再度ボタンで再生）。
 */
import { useCallback, useEffect, useState } from 'react';
import { useAnimationFrame } from './useAnimationFrame';
import { clamp01 } from '../math/interpolation';

export type RunPhase = 'idle' | 'running' | 'done';

interface RunAnimation {
  phase: RunPhase;
  /** 0〜1 の進捗。idle では 0、done では 1。 */
  progress: number;
  /** アニメーションを開始する（idle/done どちらからでも頭から再生）。 */
  run: () => void;
  /** idle に戻す。 */
  reset: () => void;
}

/**
 * @param durationSec アニメーションの長さ [秒]
 * @param resetKey    変化すると idle に戻す依存値（スライダー値や音源など）
 */
export function useRunAnimation(durationSec: number, resetKey: unknown): RunAnimation {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [progress, setProgress] = useState(0);
  // run() のたびに増やし、useAnimationFrame の開始時刻をリセットする。
  const [runToken, setRunToken] = useState(0);

  // resetKey が変わったら実行前状態へ戻す。
  useEffect(() => {
    setPhase('idle');
    setProgress(0);
  }, [resetKey]);

  const run = useCallback(() => {
    setProgress(0);
    setPhase('running');
    setRunToken((t) => t + 1);
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setProgress(0);
  }, []);

  useAnimationFrame(
    (elapsedSec) => {
      const next = clamp01(elapsedSec / durationSec);
      setProgress(next);
      if (next >= 1) setPhase('done'); // 完了したら停止
    },
    phase === 'running',
    runToken,
  );

  return { phase, progress, run, reset };
}
