/**
 * 符号化されたビット列を、グラフ下部に構成していく表示（Step3）。
 *
 * 変換済みの点ごとに「ビット数ぶんの 0/1」を1ブロックとして並べ、
 * 左から順にデータが積み上がっていく様子を見せる。
 * 各ブロックは元のレベル番号(10進)も小さく添え、対応を分かるようにする。
 */
import { toBinary } from '../math/encoding';
import { theme } from '../visualization/theme';
import styles from './BitStream.module.css';

interface Props {
  /** 変換対象の全点のレベル番号（表示区間内, 時刻昇順）。 */
  levels: number[];
  bitDepth: number;
  /** 変換済みの個数（先頭から）。これより後ろは未確定として薄く表示。 */
  encodedCount: number;
}

export function BitStream({ levels, bitDepth, encodedCount }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.stream}>
        {levels.map((level, i) => {
          const encoded = i < encodedCount;
          const bits = toBinary(level, bitDepth);
          return (
            <div
              key={i}
              className={`${styles.block} ${encoded ? styles.encoded : styles.pending}`}
            >
              <span className={styles.level}>{encoded ? level : '?'}</span>
              <span className={styles.bits}>
                {bits.split('').map((b, j) => (
                  <span
                    key={j}
                    className={styles.bit}
                    style={{
                      color: !encoded ? '#1e293b' : b === '1' ? theme.binaryOn : theme.binaryOff,
                    }}
                  >
                    {encoded ? b : '·'}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.caption}>
        {encodedCount} / {levels.length} 点を符号化（{encodedCount * bitDepth} ビット）
      </div>
    </div>
  );
}
