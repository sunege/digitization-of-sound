/**
 * 符号化の進行を管理するフック。
 *
 * 「表示区間内の点を、左から順に2進数へ変換していく」過程を扱う。
 * 変換済みの個数(encodedCount)を状態として持ち、2通りの進め方を提供する:
 *   - run()        : 「符号化を実行」ボタン。左→右へ自動で全点を変換する。
 *   - encodeUpTo(n): 点クリック。クリックした点まで（n個目まで）を一気に変換する。
 *
 * total（対象点数）が変わったら最初(0個)に戻す。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from './useAnimationFrame';

interface EncodingProgress {
  /** 変換済みの点数（0〜total）。 */
  encodedCount: number;
  /** 自動変換中か。 */
  running: boolean;
  /** 全点変換が完了したか。 */
  done: boolean;
  /** 自動変換を開始（先頭から）。 */
  run: () => void;
  /** n個目まで変換する（点クリック用。既に進んでいればそのまま）。 */
  encodeUpTo: (n: number) => void;
  /** 0個に戻す。 */
  reset: () => void;
}

/**
 * @param total       対象の点数（表示区間内の量子化点の数）
 * @param perPointSec 1点あたりの自動変換にかける時間 [秒]
 * @param resetKey    変化すると 0個へ戻す依存値
 */
export function useEncodingProgress(
  total: number,
  perPointSec: number,
  resetKey: unknown,
): EncodingProgress {
  const [encodedCount, setEncodedCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [runToken, setRunToken] = useState(0);
  // 自動変換の開始時点で既に変換済みだった数（クリック途中から実行する場合に使う）。
  const startCountRef = useRef(0);

  // resetKey が変わったら最初へ戻す。
  useEffect(() => {
    setEncodedCount(0);
    setRunning(false);
  }, [resetKey]);

  const run = useCallback(() => {
    startCountRef.current = 0;
    setEncodedCount(0);
    setRunning(true);
    setRunToken((t) => t + 1);
  }, []);

  const encodeUpTo = useCallback(
    (n: number) => {
      // 自動変換中はクリックを無視（操作の競合を避ける）。
      setRunning(false);
      setEncodedCount((prev) => Math.max(prev, Math.min(n, total)));
    },
    [total],
  );

  const reset = useCallback(() => {
    setEncodedCount(0);
    setRunning(false);
  }, []);

  // 自動変換: 経過時間に応じて変換済み点数を増やす。
  useAnimationFrame(
    (elapsedSec) => {
      const advanced = Math.floor(elapsedSec / perPointSec);
      const next = Math.min(total, startCountRef.current + advanced);
      setEncodedCount(next);
      if (next >= total) setRunning(false); // 完了
    },
    running,
    runToken,
  );

  return {
    encodedCount,
    running,
    done: encodedCount >= total && total > 0,
    run,
    encodeUpTo,
    reset,
  };
}
