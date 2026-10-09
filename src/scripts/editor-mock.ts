import { portPoint } from '../data/mock-graph';

// Timelines for the vector editor in the tour. Each step first snaps the
// editor to that step's starting state, then plays; switching steps aborts
// whatever is running.

const CANVAS = { x: 280, y: 74 };
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Pt = { x: number; y: number };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function mountMock(root: HTMLElement) {
  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const qa = <T extends Element = HTMLElement>(s: string) => Array.from(root.querySelectorAll<T>(s));
  const stage = q('[data-stage]');
  const cam = q('[data-cam]');
  const cursor = q('[data-m="cursor"]');
  const ghost = q('[data-m="ghost"]');
  const live = q<SVGPathElement>('[data-m="livewire"]');
  const tip = q('[data-m="tip"]');
  const status = q('[data-m="status"]');
  const device = q('[data-m="device"]');
  const runBtn = q('[data-m="run"]');
  const log = q('[data-m="log"]');
  const results = q('.m-results');
  const tabLog = q('[data-m="tab-log"]');
  const tabTrain = q('[data-m="tab-train"]');
  const loss = q('[data-m="loss"]');
  const vizChart = q('[data-m="vizchart"]');
  const result = q('[data-m="result"]');
  const progress = q('[data-m="progress"]');
  const insp = q('[data-m="insp"]');
  const node = (id: string) => q(`[data-node="${id}"]`);
  const edge = (id: string) => q<SVGPathElement>(`[data-edge="${id}"]`);
  const port = (id: string, name: string, side: 'in' | 'out') => q(`[data-port="${id}:${name}:${side}"]`);

  // Fallback scaling where container query units are missing.
  if (!CSS.supports('width', '1cqw')) {
    new ResizeObserver(() => root.style.setProperty('--mock-s', String(root.clientWidth / 1280))).observe(root);
  }

  let token = 0;
  let cur: Pt = { x: 900, y: 560 };
  const alive = (t: number) => t === token;
  const sleep = (ms: number, t: number) =>
    new Promise<void>((res, rej) => setTimeout(() => (alive(t) ? res() : rej(new Error('abort'))), reduced() ? 0 : ms));

  const offsetIn = (el: HTMLElement): Pt => {
    let x = 0;
    let y = 0;
    let e: HTMLElement | null = el;
    while (e && e !== stage) {
      x += e.offsetLeft;
      y += e.offsetTop;
      e = e.offsetParent as HTMLElement | null;
    }
    return { x, y };
  };
  const center = (el: HTMLElement): Pt => {
    const p = offsetIn(el);
    return { x: p.x + el.offsetWidth / 2, y: p.y + el.offsetHeight / 2 };
  };
  const portAt = (id: string, name: string, side: 'in' | 'out'): Pt => {
    const p = portPoint(id, name, side);
    return { x: CANVAS.x + p.x, y: CANVAS.y + p.y };
  };
  const place = (p: Pt) => {
    cur = p;
    cursor.style.transform = `translate(${p.x - 2}px, ${p.y - 2}px)`;
  };

  // Move the pointer, optionally dragging something along.
  function move(to: Pt, ms: number, t: number, onFrame?: (p: Pt) => void) {
    const from = { ...cur };
    if (reduced()) {
      place(to);
      onFrame?.(to);
      return Promise.resolve();
    }
    return new Promise<void>((res, rej) => {
      const t0 = performance.now();
      const frame = (now: number) => {
        if (!alive(t)) return rej(new Error('abort'));
        const k = ease(Math.min(1, (now - t0) / ms));
        const p = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
        place(p);
        onFrame?.(p);
        if (k < 1) requestAnimationFrame(frame);
        else res();
      };
      requestAnimationFrame(frame);
    });
  }

  const focus = (cx: number, cy: number, s: number) => {
    const tx = Math.min(0, Math.max(1280 - 1280 * s, 640 - cx * s));
    const ty = Math.min(0, Math.max(800 - 800 * s, 400 - cy * s));
    cam.style.transform = s === 1 ? '' : `translate(${tx}px, ${ty}px) scale(${s})`;
  };

  const logLine = (html: string) => {
    const p = document.createElement('p');
    p.innerHTML = html;
    log.append(p);
    while (log.children.length > 6) log.firstElementChild!.remove();
  };

  const wireTo = (a: Pt, b: Pt) => {
    const ax = a.x - CANVAS.x;
    const ay = a.y - CANVAS.y;
    const bx = b.x - CANVAS.x;
    const by = b.y - CANVAS.y;
    const mx = (ax + bx) / 2;
    return `M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}`;
  };

  // ---------------------------------------------------------------- states
  const RUN_ORDER = ['start', 'dataset', 'test', 'loss', 'loader', 'model', 'optim', 'train', 'viz', 'eval', 'print'];

  function setState(step: number) {
    qa('.m-node').forEach((n) => n.classList.remove('is-running', 'is-done', 'is-selected', 'is-hidden'));
    qa('.m-wire').forEach((w) => w.classList.remove('is-hidden', 'is-drawing', 'is-flow'));
    qa('.m-port').forEach((p) => p.classList.remove('is-target', 'is-bad'));
    qa('.m-item').forEach((i) => i.classList.remove('is-hot'));
    live.setAttribute('d', '');
    q('[data-m="badwire"]').setAttribute('d', '');
    tip.classList.remove('is-on');
    ghost.classList.remove('is-on');
    cursor.classList.remove('is-down');
    runBtn.classList.remove('is-pressed');
    insp.classList.remove('is-open');
    progress.style.width = '0';
    device.classList.remove('is-flash');
    const done = step >= 3;
    device.textContent = step >= 3 ? 'cuda:0' : 'Follow Settings (CPU)';
    status.dataset.state = done ? 'done' : 'idle';
    status.querySelector('span')!.textContent = done ? 'Done' : 'Idle';
    result.classList.toggle('is-set', done);
    result.querySelector('code')!.textContent = done ? '0.99' : '—';
    vizChart.classList.toggle('is-drawn', done);
    loss.classList.toggle('is-drawn', done);
    loss.classList.toggle('is-on', done);
    results.classList.toggle('show-train', done);
    tabLog.classList.toggle('is-on', !done);
    tabTrain.classList.toggle('is-on', done);
    log.innerHTML = '';
    if (!done) logLine('<span class="dim">Ready. Drag a node from the library, or double-click the canvas.</span>');
    if (step === 0) {
      node('optim').classList.add('is-hidden');
      edge('e-mo').classList.add('is-hidden');
      edge('e-ot').classList.add('is-hidden');
    }
    if (step === 1) {
      edge('e-mo').classList.add('is-hidden');
      edge('e-ot').classList.add('is-hidden');
    }
    if (done) RUN_ORDER.forEach((id) => node(id).classList.add('is-done'));
  }

  // ---------------------------------------------------------------- timelines
  async function drag(t: number) {
    focus(330, 310, 1.35);
    place({ x: 760, y: 560 });
    cursor.classList.add('is-on');
    await sleep(500, t);
    const item = q('[data-lib="Optimizer"]');
    const ip = center(item);
    await move({ x: ip.x - 30, y: ip.y }, 900, t);
    item.classList.add('is-hot');
    await sleep(250, t);
    cursor.classList.add('is-down');
    ghost.classList.add('is-on');
    const target = { x: CANVAS.x + 212 + 40, y: CANVAS.y + 318 + 14 };
    const gOff = { x: -40, y: -14 };
    await move(target, 1100, t, (p) => (ghost.style.transform = `translate(${p.x + gOff.x}px, ${p.y + gOff.y}px)`));
    await sleep(120, t);
    ghost.classList.remove('is-on');
    cursor.classList.remove('is-down');
    item.classList.remove('is-hot');
    node('optim').classList.remove('is-hidden');
    await sleep(900, t);
  }

  async function wire(t: number) {
    focus(560, 250, 1.4);
    place({ x: 560, y: 600 });
    cursor.classList.add('is-on');
    await sleep(400, t);
    // first, the optimizer into a dataloader socket: refused
    const from = portAt('optim', 'optimizer', 'out');
    await move(from, 800, t);
    cursor.classList.add('is-down');
    const bad = portAt('train', 'dataloader', 'in');
    live.style.stroke = '';
    await move(bad, 900, t, (p) => live.setAttribute('d', wireTo(from, p)));
    port('train', 'dataloader', 'in').classList.add('is-bad');
    live.style.stroke = '#f66358';
    tip.classList.add('is-on');
    await sleep(1000, t);
    tip.classList.remove('is-on');
    port('train', 'dataloader', 'in').classList.remove('is-bad');
    // then the right one
    const good = portAt('train', 'optimizer', 'in');
    live.style.stroke = '';
    await move(good, 500, t, (p) => live.setAttribute('d', wireTo(from, p)));
    port('train', 'optimizer', 'in').classList.add('is-target');
    cursor.classList.remove('is-down');
    live.setAttribute('d', '');
    const e1 = edge('e-ot');
    e1.classList.remove('is-hidden');
    e1.classList.add('is-drawing');
    await sleep(500, t);
    port('train', 'optimizer', 'in').classList.remove('is-target');
    // model → optimizer
    const m = portAt('model', 'model', 'out');
    await move(m, 700, t);
    cursor.classList.add('is-down');
    const mi = portAt('optim', 'model', 'in');
    live.style.stroke = '#2095f2';
    await move(mi, 700, t, (p) => live.setAttribute('d', wireTo(m, p)));
    cursor.classList.remove('is-down');
    live.setAttribute('d', '');
    live.style.stroke = '';
    const e2 = edge('e-mo');
    e2.classList.remove('is-hidden');
    e2.classList.add('is-drawing');
    await sleep(1000, t);
  }

  async function run(t: number) {
    focus(640, 400, 1);
    place({ x: 620, y: 300 });
    cursor.classList.add('is-on');
    await sleep(300, t);
    await move(center(device), 800, t);
    cursor.classList.add('is-down');
    await sleep(160, t);
    cursor.classList.remove('is-down');
    device.textContent = 'cuda:0';
    device.classList.add('is-flash');
    await sleep(500, t);
    await move(center(runBtn), 700, t);
    runBtn.classList.add('is-pressed');
    cursor.classList.add('is-down');
    await sleep(160, t);
    runBtn.classList.remove('is-pressed');
    cursor.classList.remove('is-down');
    cursor.classList.remove('is-on');
    status.dataset.state = 'running';
    status.querySelector('span')!.textContent = 'Running';
    log.innerHTML = '';
    logLine('<span class="dim">▶ Run started on</span> <span class="val">cuda:0</span>');
    const notes: Record<string, string> = {
      dataset: 'MNIST train, 60,000 images',
      test: 'MNIST test, 10,000 images',
      loader: '938 batches of 64',
    };
    const nameOf = (id: string) => node(id).querySelector('b')!.textContent;
    for (const id of RUN_ORDER) {
      const n = node(id);
      n.classList.add('is-running');
      if (id === 'train') {
        for (let ep = 1; ep <= 5; ep++) {
          progress.style.transition = reduced() ? 'none' : 'width 0.5s linear';
          progress.style.width = `${ep * 20}%`;
          await sleep(520, t);
          logLine(`<span class="dim">TrainingLoop</span> epoch ${ep}/5  loss <span class="val">${[0.214, 0.071, 0.049, 0.037, 0.029][ep - 1]}</span>`);
        }
      } else {
        await sleep(id === 'viz' ? 380 : 200, t);
      }
      n.classList.remove('is-running');
      n.classList.add('is-done');
      qa(`.m-wire`).forEach((w) => {
        const id2 = w.getAttribute('data-edge');
        if (id2 && edgeFrom[id2] === id) w.classList.add('is-flow');
      });
      if (id === 'viz') vizChart.classList.add('is-drawn');
      if (id === 'print') {
        result.querySelector('code')!.textContent = '0.99';
        result.classList.add('is-set');
        logLine('<span class="dim">Print</span> Test accuracy: <span class="val">0.99</span>');
      } else if (id !== 'train') {
        logLine(`<span class="ok">✓</span> ${nameOf(id)}${notes[id] ? ` <span class="dim">${notes[id]}</span>` : ''}`);
      }
    }
    status.dataset.state = 'done';
    status.querySelector('span')!.textContent = 'Done';
    await sleep(700, t);
    tabLog.classList.remove('is-on');
    tabTrain.classList.add('is-on');
    results.classList.add('show-train');
    loss.classList.add('is-on');
    requestAnimationFrame(() => loss.classList.add('is-drawn'));
    await sleep(2200, t);
  }

  async function inspect(t: number) {
    focus(900, 330, 1.25);
    place({ x: 520, y: 500 });
    cursor.classList.add('is-on');
    await sleep(500, t);
    const loader = node('loader');
    const c = center(loader);
    await move({ x: c.x, y: c.y - 30 }, 900, t);
    cursor.classList.add('is-down');
    await sleep(150, t);
    cursor.classList.remove('is-down');
    loader.classList.add('is-selected');
    insp.classList.add('is-open');
    await sleep(600, t);
    cursor.classList.remove('is-on');
    await sleep(2400, t);
  }

  const edgeFrom: Record<string, string> = {};
  qa<SVGPathElement>('[data-edge]').forEach((p) => {
    // first segment of each id names its source node (see mock-graph edges)
    edgeFrom[p.dataset.edge!] = ({
      'e-start': 'start', 'e-ds': 'dataset', 'e-dl': 'loader', 'e-mt': 'model', 'e-mo': 'model',
      'e-ot': 'optim', 'e-lt': 'loss', 'e-te': 'train', 'e-tv': 'train', 'e-xe': 'test', 'e-ep': 'eval',
    } as Record<string, string>)[p.dataset.edge!];
  });

  const timelines = [drag, wire, run, inspect];

  return {
    /** Snap to a step and play it; resolves true when it finished, false if interrupted. */
    async play(step: number) {
      const t = ++token;
      setState(step);
      try {
        await timelines[step](t);
        return alive(t);
      } catch {
        return false;
      } finally {
        if (alive(t)) cursor.classList.remove('is-on');
      }
    },
    stop() {
      token++;
    },
  };
}
