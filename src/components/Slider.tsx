/**
 * 再利用可能なスライダー。サンプリング周波数・量子化ビット数の調整に使う。
 *
 * 値の候補(steps)を配列で渡す離散スライダーと、
 * min/max/step で連続的に動かすモードの両方に対応する。
 */
import styles from './Slider.module.css';

interface Props {
  label: string;
  /** 現在値。 */
  value: number;
  /** 値変更時のコールバック。 */
  onChange: (value: number) => void;
  /** 離散値の候補（指定するとこの中から選ぶスライダーになる）。 */
  steps?: number[];
  min?: number;
  max?: number;
  step?: number;
  /** 値の表示整形（例: formatHz）。 */
  format?: (value: number) => string;
}

export function Slider({ label, value, onChange, steps, min, max, step, format }: Props) {
  const display = format ? format(value) : String(value);

  // 離散モード: steps のインデックスを slider で動かす。
  if (steps) {
    const index = Math.max(0, steps.indexOf(value));
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{display}</span>
        </div>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={index}
          onChange={(e) => onChange(steps[Number(e.target.value)])}
          className={styles.range}
        />
      </div>
    );
  }

  // 連続モード。
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.range}
      />
    </div>
  );
}
