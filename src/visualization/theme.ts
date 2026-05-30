/**
 * 描画の配色・サイズ設定。
 * 色を一箇所に集約し、各 renderer から参照する（保守性のため）。
 */
export const theme = {
  background: '#0f172a', // 紺色（暗め）
  gridLine: '#1e293b', // 背景に馴染むグリッド
  gridLineStrong: '#334155', // 中央軸など強調グリッド
  samplingGrid: 'rgba(250, 204, 21, 0.45)', // サンプリング間隔の縦線（黄・破線でサンプル点と同系）
  originalWave: '#38bdf8', // 元波形（水色）
  samplePoint: '#facc15', // サンプリング点（黄）
  sampleLine: 'rgba(250, 204, 21, 0.85)', // サンプリングの落下縦線（太い実線・格子より濃く）
  quantPoint: '#f472b6', // 量子化点（ピンク）
  quantLevel: 'rgba(45, 212, 191, 0.7)', // 量子化レベル線（ティール・破線で中央軸と区別）
  quantLabel: '#5eead4', // 量子化レベル番号（明るいティール・グリッド線と同系）
  errorLine: '#ef4444', // 量子化誤差（赤）
  reconstructed: '#a3e635', // 復元波形（黄緑）
  text: '#e2e8f0',
  axisText: '#94a3b8', // 時間軸の目盛りラベル
  axisTick: '#475569', // 時間軸の目盛り線
  binaryOn: '#4ade80', // ビット 1
  binaryOff: '#475569', // ビット 0
} as const;
