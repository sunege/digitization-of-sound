import { describe, it, expect } from 'vitest';
import { downsample } from './sampling';
import { quantize, quantizationLevels } from './quantization';
import { toBinary } from './encoding';
import { dataSizeBits, dataSizeBytes } from './dataSize';
import type { AudioSignal } from '../types/audio';

describe('downsample（単純間引き）', () => {
  it('targetRate に応じた点数を返す', () => {
    // 1秒・1000Hz の信号（値は index をそのまま入れて検証しやすくする）。
    const data = new Float32Array(1000).map((_, i) => i / 1000);
    const signal: AudioSignal = { data, sampleRate: 1000, duration: 1 };

    const points = downsample(signal, 100); // 100Hz → 100点
    expect(points.length).toBe(100);
    expect(points[0].timeSec).toBeCloseTo(0);
    expect(points[1].timeSec).toBeCloseTo(0.01);
  });

  it('時刻に最も近い元サンプルを拾う', () => {
    const data = new Float32Array([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    const signal: AudioSignal = { data, sampleRate: 10, duration: 1 };
    const points = downsample(signal, 5); // 5Hz → index 0,2,4,6,8
    expect(points.map((p) => p.sourceIndex)).toEqual([0, 2, 4, 6, 8]);
  });
});

describe('quantize（量子化）', () => {
  it('レベル数は 2^bitDepth', () => {
    expect(quantizationLevels(1)).toBe(2);
    expect(quantizationLevels(8)).toBe(256);
  });

  it('1bit は 2段階（-1 か +1）へ丸める', () => {
    expect(quantize(0.3, 1).amplitude).toBe(1);
    expect(quantize(-0.3, 1).amplitude).toBe(-1);
  });

  it('誤差 = 元値 - 量子化値', () => {
    const q = quantize(0.7, 2); // levels=4
    expect(q.error).toBeCloseTo(0.7 - q.amplitude);
  });

  it('範囲外でも levelIndex が範囲内に収まる', () => {
    const q = quantize(5, 4); // levels=16 → max index 15
    expect(q.levelIndex).toBe(15);
  });
});

describe('toBinary（符号化）', () => {
  it('bitDepth 桁でゼロ埋めする', () => {
    expect(toBinary(3, 4)).toBe('0011');
    expect(toBinary(0, 4)).toBe('0000');
    expect(toBinary(15, 4)).toBe('1111');
  });
});

describe('dataSize（データサイズ）', () => {
  it('bit = rate × bit × ch × duration', () => {
    const bits = dataSizeBits({ sampleRate: 8000, bitDepth: 8, channels: 1, duration: 2 });
    expect(bits).toBe(8000 * 8 * 1 * 2);
    expect(dataSizeBytes({ sampleRate: 8000, bitDepth: 8, channels: 1, duration: 2 })).toBe(bits / 8);
  });
});
