/**
 * 共通ナビゲーション（要件§11.1, §11.2）。
 *
 * 画面上部: 「Step n / 4」と現在Stepのタイトル・説明。
 * 画面下部: 「戻る」「次へ」ボタン。
 */
import styles from './StepNavigator.module.css';

/** 各Stepの見出し情報。 */
export const STEP_INFO = [
  { title: '音の設定', description: '音は連続的に変化する波です。まずは元になる音を選びましょう。' },
  { title: 'サンプリング（標本化）', description: '音を時間方向に一定間隔で測定し、点に置き換えます。' },
  { title: '量子化', description: '測定した値を、決まった段階の値へ丸めます。' },
  { title: '符号化', description: '段階の値を 0 と 1（2進数）で表し、データにします。' },
] as const;

export const TOTAL_STEPS = STEP_INFO.length;

interface Props {
  currentStep: number;
  onPrev: () => void;
  onNext: () => void;
}

export function StepNavigator({ currentStep, onPrev, onNext }: Props) {
  const info = STEP_INFO[currentStep];

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <span className={styles.brand}>音のデジタル化</span>
        <span className={styles.badge}>
          Step {currentStep + 1} / {TOTAL_STEPS}
        </span>
        <h1 className={styles.title}>{info.title}</h1>
        <span className={styles.separator}>—</span>
        <p className={styles.description}>{info.description}</p>
      </div>

      <nav className={styles.nav}>
        <button
          type="button"
          className={styles.navButton}
          onClick={onPrev}
          disabled={currentStep === 0}
        >
          ← 戻る
        </button>
        <div className={styles.dots}>
          {STEP_INFO.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === currentStep ? styles.dotActive : ''}`} />
          ))}
        </div>
        <button
          type="button"
          className={styles.navButton}
          onClick={onNext}
          disabled={currentStep === TOTAL_STEPS - 1}
        >
          次へ →
        </button>
      </nav>
    </header>
  );
}
