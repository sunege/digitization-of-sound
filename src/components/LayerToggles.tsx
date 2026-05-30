/**
 * 表示レイヤーのON/OFFを切り替えるチェックボックス群。
 *
 * 各Stepが「何を重ねて表示するか」をチェックボックスで制御できるようにする。
 * 色見本(swatch)付きで、どの色が何かも同時に分かる。
 */
import styles from './LayerToggles.module.css';

export interface ToggleItem {
  key: string;
  label: string;
  checked: boolean;
  /** チェックボックス横の色見本（任意）。 */
  color?: string;
  /** アニメーション中など、操作させたくないとき。 */
  disabled?: boolean;
}

interface Props {
  items: ToggleItem[];
  onChange: (key: string, checked: boolean) => void;
}

export function LayerToggles({ items, onChange }: Props) {
  return (
    <div className={styles.group}>
      {items.map((item) => (
        <label key={item.key} className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}>
          <input
            type="checkbox"
            checked={item.checked}
            disabled={item.disabled}
            onChange={(e) => onChange(item.key, e.target.checked)}
          />
          {item.color && <span className={styles.swatch} style={{ background: item.color }} />}
          {item.label}
        </label>
      ))}
    </div>
  );
}
