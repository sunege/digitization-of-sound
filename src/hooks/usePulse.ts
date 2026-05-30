/**
 * 繰り返し点滅用の位相（0→1を周期的に繰り返す）を返すフック。
 * 「次にクリックする点」の強調リングなどに使う。
 *
 * @param periodSec 1周期の長さ [秒]
 * @param active    true の間だけ点滅する
 */
import { useState } from 'react';
import { useAnimationFrame } from './useAnimationFrame';

export function usePulse(periodSec: number, active: boolean): number {
  const [phase, setPhase] = useState(0);

  useAnimationFrame(
    (elapsedSec) => {
      // 経過時間を周期で割った小数部（0〜1を繰り返す）。
      setPhase((elapsedSec / periodSec) % 1);
    },
    active,
    null,
  );

  return active ? phase : 0;
}
