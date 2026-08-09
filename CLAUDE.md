# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

高校情報科向けの「音のデジタル化」学習Webアプリ。音声が **標本化（サンプリング）→ 量子化 → 符号化** を経てデジタル化される過程を、視覚的・聴覚的に段階学習できる。教育用途最優先で、視覚的理解・アニメーション・責務分離・可読性を重視する（詳細仕様は `要件.md`）。UI文言・コメントは日本語。

## Commands

```bash
npm run dev      # Vite開発サーバー起動（ポートは5173から空きを自動選択）
npm run build    # tsc -b で型チェック → vite build。型エラーがあると失敗するので変更後の検証に使う
npm run test     # Vitest で math/ の純関数テストを実行
npm run preview  # build後の成果物をプレビュー
npx vitest run src/math/math.test.ts   # 単一テストファイルの実行
```

検証は基本 `npm run build`（型チェック込み）で行う。音・Canvasアニメーションの最終確認は `npm run dev` でのブラウザ目視が必要。

## Architecture

4つのStep（Step0 音の設定 / Step1 サンプリング / Step2 量子化 / Step3 符号化）を画面遷移型で進む。`App.tsx` が `currentStep` state で表示ページを切り替え、`StepNavigator` が「戻る/次へ」を担う。

### 状態共有: DigitizationContext
`src/context/DigitizationContext.tsx` が全Step共有の状態を持つ（Step移動で保持される）。
- `originalSignal: AudioSignal` … 元音声。`signalId`（世代番号）で Float32Array の差し替えを検知する
- `params` … `sampleRate`（Step1）/ `bitDepth`（Step2）/ `channels`
- `pitchRatio` … 合成音源のピッチ倍率
- `viewport` … 波形の表示範囲（startSec / spanSec / ampScale）

### データモデル（`src/types/audio.ts`）
音声は常に `BASE_SAMPLE_RATE`(44100Hz) の `Float32Array`（値域 -1.0〜+1.0）。低レート信号も「44100Hzデータ＋論理 sampleRate」として表現する。

### 純粋計算ロジック（`src/math/`）— テスト対象
`sampling.ts`(単純間引き) / `quantization.ts`(2^bitへ丸め＋誤差) / `encoding.ts`(2進数化) / `dataSize.ts` / `interpolation.ts`。数式コメント必須。`math.test.ts` がこの層をカバーする。

### 音声合成（`src/audio/synth/`）
音源ごとに1ファイル（sine/square/sawtooth/triangle/chirp/chord/noise/piano/violin/voice）。`index.ts` の `synthesize(source, duration, pitchRatio)` が `BASE_PITCH` テーブルを使って統合する。**新音源追加時は: 合成ファイル作成 → `SourceType`(types/audio.ts) → `synthesize` の switch と `BASE_PITCH` → `SourceSelector` のボタン定義**、の4箇所を更新する。

合成の重要な落とし穴: 周波数が時間変化する音（chirp/violinのビブラート等）では `sin(2π·f(t)·t)` と書くと位相がずれて音が崩れる。**瞬時位相を積分する**（毎サンプル `phase += 2π·f·dt`）か、線形チャープの位相公式を使うこと。

### 再生（`src/audio/playback.ts`）
単一の共有 AudioContext。`createBuffer` の sampleRate には下限（仕様3000Hz）があるため、信号レートのまま渡さず、**常にContext標準レートのバッファにゼロ次ホールドで展開**して再生する（低サンプリング周波数でも鳴るようにするため）。

### マイク録音とリアルタイム表示（`src/audio/recorder.ts`）
マイクは **「準備 → 録音」の2段階**。`prepareMic()` が許可取得・ストリーム開通・ウォームアップを済ませた `MicRecorder` を返し、`MicRecorder.record(duration)` で実際に録音する。起動直後の不安定な数百msが録音の先頭に混ざるのを防ぐため、必ず準備を済ませてから録音する設計（Step0 が `idle→preparing→armed→recording` の `MicState` で制御）。`MicRecorder.getWaveform(out)` は AnalyserNode の時間領域データを返し、録音待機中・録音中のオシロスコープ表示に使う。録音結果は `BASE_SAMPLE_RATE` へリサンプリングして返す。

オシロスコープ描画は専用の `OscilloscopeCanvas`（+`OscilloscopeRenderer`）が担う。**`SharedWaveCanvas`/`EncodingCanvas` は props 変化時のみ再描画する静的キャンバスなのに対し、`OscilloscopeCanvas` は `useAnimationFrame` で毎フレーム `getWaveform` を読んで描き直す**。座標系・テーマは共通（背景→中心線→波形のレイヤー方式）だが、時刻ではなくサンプル番号をプロット幅に等間隔で並べる。

### Canvas描画（`src/visualization/`）— レイヤー方式
描画は「1レイヤー1責務」の小さな `Renderer` 関数（`(rc: RenderContext) => void`）を配列で重ねる。各ページが `layers` 配列を組み立て、`SharedWaveCanvas`（または Step3 の `EncodingCanvas`）が順に呼ぶ。**巨大Canvas関数は禁止**。

- 座標変換は `coords.ts` の `createMapper` に集約。`PLOT_MARGIN` で内側の「プロット領域」を確保し、データはその内側、軸ラベル（時間ms・量子化レベル番号）は外周マージンに描く（データと軸数値が重ならない設計）。**データ系rendererは `mapper.plotLeft/plotRight` でプロット範囲外の点をスキップすること**。
- 色は `theme.ts` に集約。
- アニメーション進捗は RenderContext に持たせず、**各 renderer のクロージャ引数**（reveal / move / opacity 等）に埋め込む。フレーム＝layers配列で完結させる。

### アニメーション
`useAnimationFrame`（rAFループ）を土台に、`useRunAnimation`（実行ボタン式: idle→running→done、resetKeyで初期化）、`useEncodingProgress`（Step3の符号化進行）、`usePulse`（点滅）がある。各Stepは「実行ボタンを押すと段階的に見せる」方式で統一されている（スライダー変更時は実行前状態にリセット）。

### レイアウト
`PageLayout` が2カラム（左=操作パネル `controls` / 右=`note`＋グラフ＋`belowGraph`スロット）。Canvasは `useElementWidth`(ResizeObserver) でカラム幅に追従、高さ固定。狭い画面では縦積み。

## Conventions

- スタイルは CSS Modules（`*.module.css`）。追加ライブラリは使わない方針。
- 関数は小さく分割、コメント多め（特に数式）。密結合・過剰最適化を避ける。
- 初期版で実装しないもの: FFT / WebGL / GPU / スマホ最適化 / MP3 / ステレオ / 高度補間。
- TS5.7+ の TypedArray ジェネリクスの落とし穴: Web Audio API（`getFloatTimeDomainData` / `copyToChannel` 等）は `Float32Array<ArrayBuffer>` を要求するが、素の `Float32Array` 注釈は `Float32Array<ArrayBufferLike>` 扱いで代入不可になる。`as Float32Array<ArrayBuffer>` でキャストするか、`buffer.getChannelData(0).set(...)` を使う。
