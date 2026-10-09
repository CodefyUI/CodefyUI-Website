// The "Train a CNN on MNIST" graph drawn by the vector editor in the tour.
// Node, port and parameter names are the real ones from the CodefyUI backend;
// wire colours are the app's data-type colours (frontend/src/styles/theme.ts).
// Geometry is computed here, at build time, so the SVG ships with its paths.

export const TYPE_COLOR: Record<string, string> = {
  trigger: '#22c55e',
  DATASET: '#b56a00',
  DATALOADER: '#9c27b0',
  MODEL: '#2095f2',
  OPTIMIZER: '#f44336',
  LOSS_FN: '#e91e63',
  TENSOR: '#40a445',
  SCALAR: '#029fb3',
  ANY: '#919191',
  IMAGE: '#ff5722',
};

export interface Port {
  name: string;
  type: string;
}
export interface MockNode {
  id: string;
  name: string;
  cat: string;
  color: string;
  x: number;
  y: number;
  w: number;
  inputs: Port[];
  outputs: Port[];
  params: [string, string][];
  extra?: 'chart' | 'result';
}

const HEAD = 28;
const ROW = 22;
const PARAM = 18;

export const nodes: MockNode[] = [
  { id: 'start', name: 'Start', cat: 'Control', color: '#22c55e', x: 20, y: 18, w: 92, inputs: [], outputs: [{ name: 'trigger', type: 'trigger' }], params: [] },
  {
    id: 'dataset', name: 'Dataset', cat: 'Data', color: '#00bcd4', x: 20, y: 96, w: 160,
    inputs: [{ name: 'trigger', type: 'trigger' }], outputs: [{ name: 'dataset', type: 'DATASET' }],
    params: [['name', 'MNIST'], ['split', 'train']],
  },
  {
    id: 'loss', name: 'Loss', cat: 'Training', color: '#f66358', x: 20, y: 420, w: 160,
    inputs: [], outputs: [{ name: 'loss_fn', type: 'LOSS_FN' }], params: [['type', 'CrossEntropyLoss']],
  },
  {
    id: 'loader', name: 'DataLoader', cat: 'Data', color: '#00bcd4', x: 212, y: 26, w: 160,
    inputs: [{ name: 'dataset', type: 'DATASET' }], outputs: [{ name: 'dataloader', type: 'DATALOADER' }],
    params: [['batch_size', '64'], ['shuffle', 'true']],
  },
  {
    id: 'model', name: 'SequentialModel', cat: 'Training', color: '#f66358', x: 212, y: 190, w: 160,
    inputs: [], outputs: [{ name: 'model', type: 'MODEL' }], params: [['layers', '7']],
  },
  {
    id: 'optim', name: 'Optimizer', cat: 'Training', color: '#f66358', x: 212, y: 318, w: 160,
    inputs: [{ name: 'model', type: 'MODEL' }], outputs: [{ name: 'optimizer', type: 'OPTIMIZER' }],
    params: [['type', 'Adam'], ['lr', '0.001']],
  },
  {
    id: 'train', name: 'TrainingLoop', cat: 'Training', color: '#f66358', x: 410, y: 26, w: 172,
    inputs: [
      { name: 'model', type: 'MODEL' },
      { name: 'dataloader', type: 'DATALOADER' },
      { name: 'optimizer', type: 'OPTIMIZER' },
      { name: 'loss_fn', type: 'LOSS_FN' },
    ],
    outputs: [{ name: 'model', type: 'MODEL' }, { name: 'losses', type: 'TENSOR' }],
    params: [['epochs', '5'], ['device', 'auto']],
  },
  {
    id: 'test', name: 'Dataset', cat: 'Data', color: '#00bcd4', x: 410, y: 400, w: 172,
    inputs: [], outputs: [{ name: 'dataset', type: 'DATASET' }], params: [['name', 'MNIST'], ['split', 'test']],
  },
  {
    id: 'eval', name: 'EvaluateModel', cat: 'Training', color: '#f66358', x: 618, y: 26, w: 160,
    inputs: [{ name: 'model', type: 'MODEL' }, { name: 'dataset', type: 'DATASET' }],
    outputs: [{ name: 'accuracy', type: 'SCALAR' }], params: [['batch_size', '256']],
  },
  {
    id: 'viz', name: 'Visualize', cat: 'Utility', color: '#8097a2', x: 618, y: 262, w: 160,
    inputs: [{ name: 'data', type: 'ANY' }], outputs: [{ name: 'image', type: 'IMAGE' }],
    params: [['plot_type', 'line']], extra: 'chart',
  },
  {
    id: 'print', name: 'Print', cat: 'Utility', color: '#8097a2', x: 816, y: 26, w: 160,
    inputs: [{ name: 'value', type: 'ANY' }], outputs: [{ name: 'value', type: 'ANY' }],
    params: [['label', 'Test accuracy']], extra: 'result',
  },
];

const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

export function nodeHeight(n: MockNode) {
  const rows = n.inputs.length + n.outputs.length;
  const params = n.params.length ? 8 + n.params.length * PARAM : 0;
  const extra = n.extra === 'chart' ? 78 : n.extra === 'result' ? 30 : 0;
  return HEAD + rows * ROW + params + extra + 4;
}

export function portPoint(id: string, port: string, side: 'in' | 'out') {
  const n = byId[id];
  const list = side === 'in' ? n.inputs : n.outputs;
  const i = list.findIndex((p) => p.name === port);
  const row = side === 'in' ? i : n.inputs.length + i;
  return { x: side === 'in' ? n.x : n.x + n.w, y: n.y + HEAD + row * ROW + ROW / 2 };
}

// [from node, port] → [to node, port]; lane = x of the vertical run, or "y:<n>" for a run under a node.
export const edges: { id: string; from: [string, string]; to: [string, string]; type: string; lane?: number; laneY?: number }[] = [
  { id: 'e-start', from: ['start', 'trigger'], to: ['dataset', 'trigger'], type: 'trigger', laneY: 80 },
  { id: 'e-ds', from: ['dataset', 'dataset'], to: ['loader', 'dataset'], type: 'DATASET', lane: 196 },
  { id: 'e-dl', from: ['loader', 'dataloader'], to: ['train', 'dataloader'], type: 'DATALOADER', lane: 390 },
  { id: 'e-mt', from: ['model', 'model'], to: ['train', 'model'], type: 'MODEL', lane: 384 },
  { id: 'e-mo', from: ['model', 'model'], to: ['optim', 'model'], type: 'MODEL', laneY: 306 },
  { id: 'e-ot', from: ['optim', 'optimizer'], to: ['train', 'optimizer'], type: 'OPTIMIZER', lane: 396 },
  { id: 'e-lt', from: ['loss', 'loss_fn'], to: ['train', 'loss_fn'], type: 'LOSS_FN', lane: 402 },
  { id: 'e-te', from: ['train', 'model'], to: ['eval', 'model'], type: 'MODEL', lane: 598 },
  { id: 'e-tv', from: ['train', 'losses'], to: ['viz', 'data'], type: 'TENSOR', lane: 604 },
  { id: 'e-xe', from: ['test', 'dataset'], to: ['eval', 'dataset'], type: 'DATASET', lane: 592 },
  { id: 'e-ep', from: ['eval', 'accuracy'], to: ['print', 'value'], type: 'SCALAR', lane: 797 },
];

function rounded(p: [number, number][], r = 8) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0);
    const l2 = Math.hypot(x2 - x1, y2 - y1);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) {
      d += ` L${x1},${y1}`;
      continue;
    }
    d += ` L${x1 - ((x1 - x0) / l1) * rr},${y1 - ((y1 - y0) / l1) * rr} Q${x1},${y1} ${x1 + ((x2 - x1) / l2) * rr},${y1 + ((y2 - y1) / l2) * rr}`;
  }
  const last = p[p.length - 1];
  return `${d} L${last[0]},${last[1]}`;
}

export function edgePath(e: (typeof edges)[number]) {
  const a = portPoint(e.from[0], e.from[1], 'out');
  const b = portPoint(e.to[0], e.to[1], 'in');
  if (e.laneY !== undefined) {
    return rounded([[a.x, a.y], [a.x + 12, a.y], [a.x + 12, e.laneY], [b.x - 12, e.laneY], [b.x - 12, b.y], [b.x, b.y]]);
  }
  const lx = e.lane ?? (a.x + b.x) / 2;
  return rounded([[a.x, a.y], [lx, a.y], [lx, b.y], [b.x, b.y]]);
}

// MNIST digit for the Inspector (a "7"), 28×28, values after the usual
// (x − 0.1307) / 0.3081 normalisation: background −0.4242, full ink 2.8215.
export function digit(): number[] {
  const g = new Array(28 * 28).fill(0);
  const ink = (x: number, y: number, v = 1) => {
    if (x >= 0 && y >= 0 && x < 28 && y < 28) g[y * 28 + x] = Math.max(g[y * 28 + x], v);
  };
  for (let x = 6; x <= 21; x++) for (let t = 0; t < 3; t++) ink(x, 6 + t, t === 1 ? 1 : 0.7);
  for (let i = 0; i <= 15; i++) {
    const x = 20 - Math.round(i * 0.55);
    const y = 9 + i;
    ink(x, y, 1);
    ink(x - 1, y, 0.85);
    ink(x + 1, y, 0.45);
  }
  return g.map((v) => (v - 0.1307) / 0.3081);
}
