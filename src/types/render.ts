/**
 * Canvas描画レイヤーに関する型定義。
 *
 * 描画は「責務ごとに分離した小さな関数(renderer)」を
 * レイヤー順に重ねて行う（要件§12.1, §19）。
 */
import type { AudioSignal, Viewport } from './audio';

/**
 * 座標変換オブジェクト。
 * 「時刻[秒]・振幅[-1..1]」を Canvas のピクセル座標へ変換する責務を持つ。
 */
export interface CoordinateMapper {
  /** 時刻 [秒] → x座標 [px]。 */
  timeToX(timeSec: number): number;
  /** 振幅 [-1..1] → y座標 [px]。 */
  ampToY(amplitude: number): number;
  /** キャンバス全体の幅 [px]（CSSピクセル）。 */
  width: number;
  /** キャンバス全体の高さ [px]（CSSピクセル）。 */
  height: number;
  /** データを描くプロット領域（内側矩形）の境界 [px]。外周は軸ラベル用マージン。 */
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
}

/**
 * 各 renderer に渡す描画コンテキスト一式。
 * renderer はこの中の必要な情報だけを使い、1レイヤーのみ描画する。
 *
 * アニメーションの進捗は「各 renderer のクロージャ引数」として埋め込み、
 * フレームごとにレイヤー配列を組み直す方式にする。
 * こうすることで RenderContext から可変の進捗値を排除でき、
 * 「いまフレームに何を描くか」がレイヤー配列だけで完結する。
 */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  mapper: CoordinateMapper;
  viewport: Viewport;
  /** 元波形（連続波形の近似）。 */
  original: AudioSignal;
}

/** 1レイヤーを描画する純粋な描画関数。 */
export type Renderer = (rc: RenderContext) => void;
