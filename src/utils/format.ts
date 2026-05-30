/**
 * 表示用の数値整形ヘルパ。
 */

/** 周波数を読みやすく整形（例: 8000 → "8.0 kHz", 440 → "440 Hz"）。 */
export function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
  return `${hz} Hz`;
}

/** バイト数を読みやすく整形（B / KB / MB）。 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${Math.round(bytes)} B`;
}

/** 秒を整形（例: 1.5 → "1.50 秒"）。 */
export function formatSeconds(sec: number): string {
  return `${sec.toFixed(2)} 秒`;
}
