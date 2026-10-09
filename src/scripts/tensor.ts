// A tiny single-channel tensor and the five ops the hero graph needs.
// Semantics follow the CodefyUI nodes they stand in for: Conv2dExplicit
// (stride 1, padding 1, presets copied from the backend), Activation and
// MaxPool2d (kernel 2, stride 2).

export interface T2 {
  h: number;
  w: number;
  data: Float32Array;
}

export const t2 = (h: number, w: number, data?: ArrayLike<number>): T2 => ({
  h,
  w,
  data: data ? Float32Array.from(data) : new Float32Array(h * w),
});

export const KERNELS: Record<string, number[]> = {
  EdgeDetection3x3: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
  Sharpen3x3: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  VerticalEdge3x3: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
};

export function conv3x3(x: T2, k: number[]): T2 {
  const out = t2(x.h, x.w);
  for (let i = 0; i < x.h; i++) {
    for (let j = 0; j < x.w; j++) {
      let s = 0;
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const ii = i + di;
          const jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= x.h || jj >= x.w) continue;
          s += x.data[ii * x.w + jj] * k[(di + 1) * 3 + (dj + 1)];
        }
      }
      out.data[i * x.w + j] = s;
    }
  }
  return out;
}

const ACT: Record<string, (v: number) => number> = {
  relu: (v) => Math.max(0, v),
  sigmoid: (v) => 1 / (1 + Math.exp(-v)),
  tanh: (v) => Math.tanh(v),
  leaky_relu: (v) => (v > 0 ? v : 0.01 * v),
  gelu: (v) => 0.5 * v * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (v + 0.044715 * v ** 3))),
};
export const ACTIVATIONS = Object.keys(ACT);

export function activate(x: T2, fn: string): T2 {
  const f = ACT[fn] ?? ACT.relu;
  return t2(x.h, x.w, Array.from(x.data, f));
}

export function maxpool2(x: T2): T2 {
  const h = Math.floor(x.h / 2);
  const w = Math.floor(x.w / 2);
  const out = t2(h, w);
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const a = x.data[2 * i * x.w + 2 * j];
      const b = x.data[2 * i * x.w + 2 * j + 1];
      const c = x.data[(2 * i + 1) * x.w + 2 * j];
      const d = x.data[(2 * i + 1) * x.w + 2 * j + 1];
      out.data[i * w + j] = Math.max(a, b, c, d);
    }
  }
  return out;
}

export function stats(x: T2) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const v of x.data) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, mean: sum / x.data.length };
}

export function fmt(v: number): string {
  if (Number.isInteger(v)) return String(v);
  const a = Math.abs(v);
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  return v.toFixed(2).replace(/0$/, '');
}
