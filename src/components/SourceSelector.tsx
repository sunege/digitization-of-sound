/**
 * 音源選択UI（要件§7.2）。
 * 声・ピアノ・ドラム・正弦波・マイク録音から選ぶ。
 */
import type { SourceType } from '../types/audio';
import styles from './SourceSelector.module.css';

interface Props {
  value: SourceType;
  onSelect: (s: SourceType) => void;
  /** マイク録音中の表示用。 */
  recording?: boolean;
}

/** 各音源の説明（マウスホバーでヒント表示）。 */
const SOURCES: { type: SourceType; label: string; icon: string; hint: string }[] = [
  { type: 'sine', label: '正弦波', icon: '〰️', hint: '1つの周波数だけの最も基本的な波。倍音がなく、デジタル化の入門に最適。' },
  { type: 'square', label: '方形波', icon: '⬛', hint: '奇数倍音が豊富な角ばった波。サンプリング不足でエイリアシングが分かりやすい。' },
  { type: 'sawtooth', label: 'のこぎり波', icon: '🪚', hint: 'すべての倍音を含む鋭い波。低いサンプリング周波数で歪みが顕著。' },
  { type: 'triangle', label: '三角波', icon: '🔺', hint: '倍音が少なめのなめらかな波。方形波との対比に。' },
  { type: 'chirp', label: 'チャープ', icon: '📈', hint: '低音→高音へ連続変化。サンプリング不足だと高音が低音に折り返るのが聴ける。' },
  { type: 'chord', label: '和音（ドミソ）', icon: '🎵', hint: 'ド・ミ・ソの3音同時。複数の周波数が混ざる様子を波形と音で確認。' },
  { type: 'noise', label: 'ノイズ', icon: '🌫️', hint: '全周波数を含むランダムな音。量子化ビット数の効果（粒状感）が分かりやすい。' },
  { type: 'piano', label: 'ピアノ', icon: '🎹', hint: '基音＋倍音を打鍵後に減衰させた音色。' },
  { type: 'violin', label: 'バイオリン', icon: '🎻', hint: '倍音豊かでビブラートのあるストリング音。緩やかに立ち上がる。' },
  { type: 'drum', label: 'ドラム', icon: '🥁', hint: 'ノイズ＋胴鳴りの打楽器音。音程がなく急速に減衰する。' },
  { type: 'voice', label: 'ロボット声', icon: '🤖', hint: '母音「あ・い・う」を合成した声風の音。フォルマント共鳴で生成。' },
  { type: 'mic', label: 'マイク録音', icon: '🎤', hint: '実際のマイク入力を録音して使う。合成音ではない本物の音声。' },
];

export function SourceSelector({ value, onSelect, recording }: Props) {
  return (
    <div className={styles.grid}>
      {SOURCES.map((s) => (
        <button
          key={s.type}
          type="button"
          title={s.hint}
          className={`${styles.item} ${value === s.type ? styles.active : ''} ${
            s.type === 'mic' ? styles.mic : ''
          }`}
          onClick={() => onSelect(s.type)}
        >
          <span className={styles.icon}>{s.icon}</span>
          <span>{s.label}</span>
          {s.type === 'mic' && recording && <span className={styles.rec}>● 録音中</span>}
        </button>
      ))}
    </div>
  );
}
