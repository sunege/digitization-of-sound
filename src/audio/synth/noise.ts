/**
 * ホワイトノイズの合成。
 *
 * 全周波数を均等に含むランダムな信号。音程はない「ザー」という音。
 * 量子化ビット数を変えたときの粒状感（量子化誤差）が分かりやすい（§5.3）。
 */
import { BASE_SAMPLE_RATE } from '../../types/audio';

/** 振幅。 */
const AMP = 0.8;

/**
 * @param durationSec 長さ [秒]
 */
export function generateNoise(durationSec: number): Float32Array {
  const length = Math.floor(durationSec * BASE_SAMPLE_RATE);
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    // -1〜+1 の一様乱数。
    data[i] = (Math.random() * 2 - 1) * AMP;
  }
  return data;
}
