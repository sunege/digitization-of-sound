/**
 * 凡例。波形の色が何を表すかを説明する（視覚的理解の補助）。
 */
import styles from './Legend.module.css';

export interface LegendItem {
  color: string;
  label: string;
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className={styles.legend}>
      {items.map((item) => (
        <span key={item.label} className={styles.item}>
          <span className={styles.swatch} style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
