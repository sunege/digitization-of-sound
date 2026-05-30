/**
 * アニメーション実行ボタン（「標本化を実行」「量子化を実行」など）。
 *
 * フェーズに応じてラベル・見た目が変わる:
 *   idle    → 実行（強調）
 *   running → 実行中…（押せない）
 *   done    → もう一度（控えめ）
 */
import type { RunPhase } from '../hooks/useRunAnimation';
import styles from './RunButton.module.css';

interface Props {
  phase: RunPhase;
  /** idle/done のときのラベル（例: "標本化を実行"）。 */
  label: string;
  onRun: () => void;
}

export function RunButton({ phase, label, onRun }: Props) {
  const running = phase === 'running';
  const text = running ? '実行中…' : phase === 'done' ? 'もう一度' : label;

  return (
    <button
      type="button"
      className={`${styles.button} ${phase === 'idle' ? styles.primary : styles.secondary}`}
      onClick={onRun}
      disabled={running}
    >
      <span className={styles.icon}>{running ? '…' : '▶'}</span>
      {text}
    </button>
  );
}
