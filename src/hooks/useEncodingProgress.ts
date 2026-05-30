/**
 * 符号化の進行状態を管理するフック（Step3）。
 *
 * 変換済みの個数(encodedCount)を状態として持ち、進め方を提供する:
 *   1. run()        … 現在の位置から一定間隔で1つずつ自動変換する（「符号化を実行」ボタン）
 *   2. encodeUpTo() … 指定位置まで即座に増やす（点を直接クリック）
 *   3. reset()      … 符号化前（0個）の状態に戻す（「もう一度」ボタン）
 *
 * クリックで途中まで進めてから run() を押すと、その続きから自動変換する。
 * 表示区間やパラメータが変わったら resetKey で 0個にリセットする。
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnimationFrame } from './useAnimationFrame';

interface EncodingProgress {
  encodedCount: number;
  running: boolean;
  done: boolean;
  run: () => void;
  encodeUpTo: (count: number) => void;
  reset: () => void;
}

/**
 * @param total       符号化対象の総数（表示区間内の点の数）
 * @param perPointSec 1点あたりの自動変換時間 [秒]
 * @param resetKey    これが変わると進行を 0個にリセットする
 */
export function useEncodingProgress(
  total: number,
  perPointSec: number,
  resetKey: string,
): EncodingProgress {
  const [encodedCount, setEncodedCount] = useState(0);
  const [running, setRunning] = useState(false);

  // 自動進行を開始した時点の変換済み数（ここから続きを自動変換する）。
  const startCountRef = useRef(0);
  // 最新の encodedCount を run() から参照するためのミラー。
  const countRef = useRef(0);
  countRef.current = encodedCount;

  // resetKey が変わったら最初から。
  useEffect(() => {
    setEncodedCount(0);
    setRunning(false);
  }, [resetKey]);

  // 自動進行（running 中だけ animationFrame で進める）。
  // 開始時点の数(startCountRef)に、経過時間ぶんの点数を足していく。
  useAnimationFrame(
    (elapsedSec) => {
      const next = Math.min(total, startCountRef.current + Math.floor(elapsedSec / perPointSec));
      setEncodedCount(next);
      if (next >= total) setRunning(false);
    },
    running,
    null,
  );

  // 「符号化を実行」: 今の変換済み位置から続けて自動変換する。
  // （クリックで途中まで進めていれば、その続きから再開する）
  const run = useCallback(() => {
    startCountRef.current = countRef.current;
    setRunning(true);
  }, []);

  // 点を直接クリック: 指定位置まで即座に変換（自動進行は止める）。
  // 既に進んでいる位置より手前をクリックしても戻さない（前進のみ）。
  const encodeUpTo = useCallback(
    (count: number) => {
      setRunning(false);
      setEncodedCount((prev) => Math.max(prev, Math.min(count, total)));
    },
    [total],
  );

  // 「もう一度」: 符号化前（0個）の状態に戻す（自動では始めない）。
  const reset = useCallback(() => {
    setRunning(false);
    setEncodedCount(0);
    startCountRef.current = 0;
  }, []);

  // 進行状況を返す。
  const enc = {
    encodedCount,
    running,
    done: encodedCount >= total && total > 0,
    run,
    encodeUpTo,
    reset,
  };
  return enc;
}
