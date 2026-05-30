/**
 * requestAnimationFrame をReactで扱うためのフック（要件§16.1）。
 *
 * 経過時間に応じた進捗(0→1)を計算したいアニメーション全般で使う。
 */
import { useEffect, useRef } from 'react';

/**
 * 毎フレーム callback を呼ぶ。
 *
 * @param callback  (elapsedSec) => void。アニメ開始からの経過秒を受け取る。
 * @param active    true の間だけループする。
 * @param resetKey  この値が変わるとアニメーションを最初からやり直す。
 */
export function useAnimationFrame(
  callback: (elapsedSec: number) => void,
  active: boolean,
  resetKey: unknown = null,
): void {
  // 最新の callback を ref に保持（依存配列に入れず再起動を防ぐ）。
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    let rafId = 0;
    let startTime: number | null = null;

    const loop = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsedSec = (now - startTime) / 1000;
      callbackRef.current(elapsedSec);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [active, resetKey]);
}
