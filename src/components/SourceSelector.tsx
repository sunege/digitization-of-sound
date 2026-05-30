/**
 * 音源選択UI（要件§7.2）。
 * 声・ピアノ・ドラム・正弦波・マイク録音から選ぶ。
 */
import type { SourceType } from '../types/audio';
import styles from './SourceSelector.module.css';

/**
 * マイク録音の状態。
 *   idle      … 未選択（ボタンは「マイク録音」）
 *   preparing … 許可取得・ウォームアップ中（「準備中…」）
 *   armed     … 準備完了、録音待機（「録音開始」）
 *   recording … 録音中（「● 録音中」）
 */
export type MicState = 'idle' | 'preparing' | 'armed' | 'recording';

interface Props {
  value: SourceType;
  onSelect: (s: SourceType) => void;
  /** マイクの状態（ボタンの表示を切り替える）。 */
  micState?: MicState;
}

/** マイク状態ごとのボタン表示文言。 */
const MIC_LABEL: Record<MicState, string> = {
  idle: 'マイク録音',
  preparing: '準備中…',
  armed: '録音開始',
  recording: '● 録音中',
};

/** 各音源の説明（マウスホバーでヒント表示）。 */
const SOURCES: { type: SourceType; label: string; icon: string; hint: string }[] = [
  { type: 'sine', label: '正弦波', icon: '〰️', hint: '1つの周波数だけの最も基本的な波。倍音がなく、デジタル化の入門に最適。' },
  { type: 'square', label: '矩形波', icon: '⬛', hint: '奇数倍音が豊富な角ばった波。サンプリング不足でエイリアシングが分かりやすい。' },
  { type: 'sawtooth', label: 'のこぎり波', icon: '🪚', hint: 'すべての倍音を含む鋭い波。低いサンプリング周波数で歪みが顕著。' },
  { type: 'triangle', label: '三角波', icon: '🔺', hint: '倍音が少なめのなめらかな波。方形波との対比に。' },
  { type: 'chirp', label: 'チャープ', icon: '📈', hint: '低音→高音へ連続変化。サンプリング不足だと高音が低音に折り返るのが聴ける。' },
  // \n で改行（CSS の white-space: pre-line で2行表示する）。
  { type: 'chord', label: '和音\n（ドミソ）', icon: '🎵', hint: 'ド・ミ・ソの3音同時。複数の周波数が混ざる様子を波形と音で確認。' },
  { type: 'noise', label: 'ノイズ', icon: '🌫️', hint: '全周波数を含むランダムな音。量子化ビット数の効果（粒状感）が分かりやすい。' },
  { type: 'piano', label: 'ピアノ', icon: '🎹', hint: '基音＋倍音を打鍵後に減衰させた音色。' },
  { type: 'violin', label: 'バイオリン', icon: '🎻', hint: '倍音豊かでビブラートのあるストリング音。緩やかに立ち上がる。' },
  { type: 'drum', label: 'ドラム', icon: '🥁', hint: 'ノイズ＋胴鳴りの打楽器音。音程がなく急速に減衰する。' },
  { type: 'voice', label: 'ロボット声', icon: '🤖', hint: '母音「あ・い・う」を合成した声風の音。フォルマント共鳴で生成。' },
  { type: 'mic', label: 'マイク録音', icon: '🎤', hint: '実際のマイク入力を録音して使う。合成音ではない本物の音声。' },
];

export function SourceSelector({ value, onSelect, micState = 'idle' }: Props) {
  return (
    <div className={styles.grid}>
      {SOURCES.map((s) => {
        const isMic = s.type === 'mic';
        // マイクボタンは状態に応じてラベル・見た目を変える。
        const label = isMic ? MIC_LABEL[micState] : s.label;
        const micClass = isMic
          ? `${styles.mic} ${micState === 'armed' ? styles.armed : ''} ${
              micState === 'recording' ? styles.recording : ''
            }`
          : '';
        return (
          <button
            key={s.type}
            type="button"
            title={s.hint}
            className={`${styles.item} ${value === s.type ? styles.active : ''} ${micClass}`}
            onClick={() => onSelect(s.type)}
          >
            <span className={styles.icon}>{s.icon}</span>
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
