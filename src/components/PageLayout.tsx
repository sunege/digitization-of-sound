/**
 * 各Stepの共通レイアウト。
 *
 * 1画面でグラフと操作の両方が見えるよう、左右2カラムにする:
 *   左カラム: 操作パネル
 *   右カラム: 補足説明 + 波形Canvas
 * 画面が狭いときは縦積みにフォールバックする（CSS側のメディアクエリ）。
 */
import type { ReactNode } from 'react';
import styles from './PageLayout.module.css';

interface Props {
  /** Canvas の上に出す補足説明（任意）。 */
  note?: ReactNode;
  /** 波形Canvas。 */
  canvas: ReactNode;
  /** 操作パネル。 */
  controls: ReactNode;
  /** グラフの直下に置く要素（表示/非表示チェックボックスなど。任意）。 */
  belowGraph?: ReactNode;
}

export function PageLayout({ note, canvas, controls, belowGraph }: Props) {
  return (
    <div className={styles.layout}>
      <div className={styles.controls}>{controls}</div>
      <div className={styles.graph}>
        {note && <div className={styles.note}>{note}</div>}
        <div className={styles.canvasArea}>{canvas}</div>
        {belowGraph && <div className={styles.belowGraph}>{belowGraph}</div>}
      </div>
    </div>
  );
}
