/**
 * 音声再生ボタン。ラベルと再生状態に応じた見た目を持つ。
 */
import styles from './PlayButton.module.css';

interface Props {
  label: string;
  isPlaying: boolean;
  onClick: () => void;
  /** 強調表示（元音声 vs デジタル化後 などの区別に使う）。 */
  variant?: 'primary' | 'secondary';
}

export function PlayButton({ label, isPlaying, onClick, variant = 'primary' }: Props) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.icon}>{isPlaying ? '■' : '▶'}</span>
      {label}
    </button>
  );
}
