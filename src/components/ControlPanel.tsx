/**
 * 操作パネルの共通枠（要件§18）。
 * 各Stepが中にスライダーや再生ボタンを配置する。
 */
import type { ReactNode } from 'react';
import styles from './ControlPanel.module.css';

export function ControlPanel({ children }: { children: ReactNode }) {
  return <div className={styles.panel}>{children}</div>;
}
