import { KERNELS, activate, conv3x3, fmt, maxpool2, stats, t2, type T2 } from './tensor';

type NodeId = 'start' | 'input' | 'conv' | 'act' | 'pool' | 'viz';
type Layout = Record<NodeId, { x: number; y: number }>;

interface Strings {
  run: string;
  running: string;
  idle: string;
  done: string;
  reran: [string, string];
  input: string;
  output: string;
  changed: string;
  shape: string;
  min: string;
  max: string;
  mean: string;
  pickNode: string;
  hintTouch: string;
}

const ORDER: NodeId[] = ['input', 'conv', 'act', 'pool', 'viz'];
const EDGES: [string, string, 'trigger' | 'tensor'][] = [
  ['start:out', 'input:trigger', 'trigger'],
  ['input:out', 'conv:in', 'tensor'],
  ['conv:out', 'act:in', 'tensor'],
  ['act:out', 'pool:in', 'tensor'],
  ['pool:out', 'viz:in', 'tensor'],
];

// Two hand-placed layouts in world units. "wide" is a two-row circuit like the
// app's own example graphs; "stack" is a single column for narrow screens.
const WIDE: { w: number; h: number; pos: Layout } = {
  w: 950,
  h: 470,
  pos: {
    start: { x: 0, y: 6 },
    input: { x: 152, y: 6 },
    conv: { x: 462, y: 6 },
    act: { x: 746, y: 22 },
    pool: { x: 462, y: 300 },
    viz: { x: 746, y: 316 },
  },
};
// A shorter, wider arrangement for 16:9 windows, where height is what runs out first.
const ROW: { w: number; h: number; pos: Layout } = {
  w: 1194,
  h: 470,
  pos: {
    start: { x: 0, y: 6 },
    input: { x: 152, y: 6 },
    conv: { x: 462, y: 6 },
    act: { x: 746, y: 6 },
    pool: { x: 746, y: 196 },
    viz: { x: 990, y: 6 },
  },
};
const STACK: { w: number; h: number; pos: Layout } = {
  w: 330,
  h: 1450,
  pos: {
    start: { x: 0, y: 0 },
    input: { x: 40, y: 92 },
    conv: { x: 40, y: 560 },
    act: { x: 40, y: 840 },
    pool: { x: 40, y: 990 },
    viz: { x: 40, y: 1140 },
  },
};

const PATTERNS: Record<string, string> = {
  digit: '........ .######. ......#. .....#.. ....#... ...#.... ...#.... ........',
  ring: '........ ..####.. .#....#. .#....#. .#....#. .#....#. ..####.. ........',
  cross: '...##... ...##... ...##... ######## ######## ...##... ...##... ...##...',
  clear: '........ ........ ........ ........ ........ ........ ........ ........',
};
const pattern = (name: string) => Array.from(PATTERNS[name].replace(/ /g, ''), (c) => (c === '#' ? 1 : 0));

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));

export function mountDemo(root: HTMLElement) {
  const S: Strings = JSON.parse(root.dataset.strings ?? '{}');
  const canvas = root.querySelector<HTMLElement>('[data-canvas]')!;
  const world = root.querySelector<HTMLElement>('[data-world]')!;
  const svg = root.querySelector<SVGSVGElement>('[data-wires]')!;
  const runBtn = root.querySelector<HTMLButtonElement>('[data-run]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const inspector = root.querySelector<HTMLElement>('[data-inspector-body]')!;
  const gridEl = root.querySelector<HTMLElement>('[data-grid]')!;
  const cellEls = Array.from(gridEl.querySelectorAll<HTMLButtonElement>('[data-cell]'));
  const kernelEl = root.querySelector<HTMLElement>('[data-kernel]')!;
  const vizEl = root.querySelector<HTMLElement>('[data-viz]')!;
  const presetSel = root.querySelector<HTMLSelectElement>('[data-param="preset"]')!;
  const actSel = root.querySelector<HTMLSelectElement>('[data-param="function"]')!;
  const nodeEls = Object.fromEntries(
    Array.from(root.querySelectorAll<HTMLElement>('[data-node]')).map((el) => [el.dataset.node, el]),
  ) as Record<NodeId, HTMLElement>;

  if (window.matchMedia('(hover: none)').matches) {
    const hint = root.querySelector<HTMLElement>('[data-hint]');
    if (hint) hint.textContent = S.hintTouch;
  }

  // ---------------------------------------------------------------- state
  let values = pattern('digit');
  const outputs = new Map<NodeId, T2>();
  const dirty = new Set<NodeId>(ORDER);
  let selected: NodeId | null = null;
  let running = false;
  let hasRun = false;
  let mode: 'wide' | 'row' | 'stack' = 'wide';
  let scale = 1;
  let topZ = 1;
  const pos: Layout = structuredClone(WIDE.pos);

  // ---------------------------------------------------------------- compute
  const compute: Record<Exclude<NodeId, 'start'>, () => T2> = {
    input: () => t2(8, 8, values),
    conv: () => conv3x3(outputs.get('input')!, KERNELS[presetSel.value]),
    act: () => activate(outputs.get('conv')!, actSel.value),
    pool: () => maxpool2(outputs.get('act')!),
    viz: () => outputs.get('pool')!,
  };
  const upstream: Record<NodeId, NodeId | null> = {
    start: null,
    input: null,
    conv: 'input',
    act: 'conv',
    pool: 'act',
    viz: 'pool',
  };

  function markDirty(from: NodeId) {
    const i = ORDER.indexOf(from);
    ORDER.slice(i).forEach((n) => dirty.add(n));
    ORDER.slice(i).forEach((n) => nodeEls[n].classList.add('is-stale'));
  }

  // ---------------------------------------------------------------- layout
  // Bounds of the nodes where they stand now, plus a margin.
  function bounds() {
    let w = 0;
    let h = 0;
    (Object.keys(pos) as NodeId[]).forEach((id) => {
      w = Math.max(w, pos[id].x + nodeEls[id].offsetWidth + 8);
      h = Math.max(h, pos[id].y + nodeEls[id].offsetHeight + 12);
    });
    return { w, h };
  }

  let avail = 0;
  // Size the world to the nodes; the canvas grows with it, so a node can be dragged anywhere below.
  function fitWorld() {
    const b = bounds();
    const w = Math.max(b.w, avail / scale);
    world.style.width = `${w}px`;
    world.style.height = `${b.h}px`;
    // a transform does not shrink the layout box, so take the difference back with margins
    world.style.marginBottom = `${b.h * scale - b.h}px`;
    world.style.marginRight = `${w * scale - w}px`;
    canvas.style.minHeight = `${b.h * scale}px`;
    drawWires();
  }

  const LAYOUTS = { wide: WIDE, row: ROW, stack: STACK };
  const layoutOf = () => LAYOUTS[mode];

  // Bounds of a layout's default positions, measured with the real node sizes.
  function boundsOf(L: { pos: Layout }) {
    const saved = structuredClone(pos);
    Object.assign(pos, structuredClone(L.pos));
    const b = bounds();
    Object.assign(pos, saved);
    return b;
  }

  function applyLayout() {
    const cs = getComputedStyle(canvas);
    avail = canvas.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // On wide screens the whole graph also fits the viewport height, so the demo is one screen.
    // Everything on the demo's screen that is not canvas: section padding, heading, toolbar, caption.
    const section = root.closest<HTMLElement>('.screen');
    let around = 0;
    if (section) {
      const ss = getComputedStyle(section);
      const head = section.querySelector<HTMLElement>('.demo-head');
      const hs = head ? getComputedStyle(head) : null;
      around =
        parseFloat(ss.paddingTop) +
        parseFloat(ss.paddingBottom) +
        (head ? head.offsetHeight + parseFloat(hs!.marginBottom) : 0);
    }
    const chrome = root.offsetHeight - canvas.offsetHeight;
    const fitH = Math.max(300, window.innerHeight - around - chrome - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 6);
    const scaleFor = (L: { pos: Layout }) => {
      const b = boundsOf(L);
      return Math.min(1, avail / b.w, fitH / b.h);
    };
    let next: typeof mode = 'stack';
    if (avail >= 720) next = scaleFor(ROW) > scaleFor(WIDE) + 0.02 ? 'row' : 'wide';
    if (next !== mode) {
      mode = next;
      Object.assign(pos, structuredClone(layoutOf().pos));
    }
    (Object.keys(pos) as NodeId[]).forEach((id) => {
      nodeEls[id].style.transform = `translate(${pos[id].x}px, ${pos[id].y}px)`;
    });
    // Scale from the default layout (not from where nodes were dragged), so a drag never shrinks the graph.
    const b = boundsOf(layoutOf());
    scale = mode === 'stack' ? Math.min(1, avail / b.w) : Math.min(1, avail / b.w, fitH / b.h);
    world.style.transform = `scale(${scale})`;
    world.style.marginLeft = mode === 'stack' ? `${Math.max(0, (avail - b.w * scale) / 2)}px` : '0px';
    root.dataset.layout = mode;
    fitWorld();
  }

  function portPoint(key: string) {
    const el = root.querySelector<HTMLElement>(`[data-port="${key}"] .dot`)!;
    const r = el.getBoundingClientRect();
    const w = world.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - w.left) / scale, y: (r.top + r.height / 2 - w.top) / scale };
  }
  function nodeBox(id: string) {
    const r = nodeEls[id as NodeId].getBoundingClientRect();
    const w = world.getBoundingClientRect();
    return { top: (r.top - w.top) / scale, bottom: (r.bottom - w.top) / scale };
  }

  // Orthogonal "circuit" routing with rounded corners, the editor's default
  // connection style.
  function route(a: { x: number; y: number }, b: { x: number; y: number }, src: string, dst: string) {
    let pts: [number, number][];
    if (b.x - a.x >= 36) {
      const mx = Math.round(a.x + (b.x - a.x) / 2);
      pts = [[a.x, a.y], [mx, a.y], [mx, b.y], [b.x, b.y]];
    } else {
      const s = nodeBox(src);
      const d = nodeBox(dst);
      const lane = d.top > s.bottom ? d.top - 14 : Math.max(s.bottom, d.bottom) + 24;
      pts = [[a.x, a.y], [a.x + 20, a.y], [a.x + 20, lane], [b.x - 20, lane], [b.x - 20, b.y], [b.x, b.y]];
    }
    return rounded(pts, 10);
  }
  function rounded(p: [number, number][], r: number) {
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
      const ax = x1 - ((x1 - x0) / l1) * rr;
      const ay = y1 - ((y1 - y0) / l1) * rr;
      const bx = x1 + ((x2 - x1) / l2) * rr;
      const by = y1 + ((y2 - y1) / l2) * rr;
      d += ` L${ax},${ay} Q${x1},${y1} ${bx},${by}`;
    }
    const last = p[p.length - 1];
    return d + ` L${last[0]},${last[1]}`;
  }

  const wirePaths = new Map<string, { base: SVGPathElement; pulse: SVGPathElement }>();
  function drawWires() {
    const NS = 'http://www.w3.org/2000/svg';
    const L = layoutOf();
    svg.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
    svg.setAttribute('width', String(L.w));
    svg.setAttribute('height', String(L.h));
    for (const [from, to, kind] of EDGES) {
      const key = `${from}>${to}`;
      let w = wirePaths.get(key);
      if (!w) {
        const base = document.createElementNS(NS, 'path');
        const pulse = document.createElementNS(NS, 'path');
        base.setAttribute('class', `wire wire--${kind}`);
        pulse.setAttribute('class', `wire-pulse wire-pulse--${kind}`);
        svg.append(base, pulse);
        w = { base, pulse };
        wirePaths.set(key, w);
      }
      const d = route(portPoint(from), portPoint(to), from.split(':')[0], to.split(':')[0]);
      w.base.setAttribute('d', d);
      w.pulse.setAttribute('d', d);
    }
  }

  function pulse(from: NodeId) {
    const edge = EDGES.find(([f]) => f.startsWith(from + ':'));
    if (!edge || reduced()) return;
    const w = wirePaths.get(`${edge[0]}>${edge[1]}`);
    if (!w) return;
    const len = w.pulse.getTotalLength();
    w.pulse.style.strokeDasharray = `46 ${len + 46}`;
    w.pulse.animate(
      [
        { strokeDashoffset: 46, opacity: 1 },
        { strokeDashoffset: -len, opacity: 1 },
      ],
      { duration: Math.min(620, 220 + len * 0.9), easing: 'cubic-bezier(.45,0,.2,1)' },
    );
  }

  // ---------------------------------------------------------------- render
  function heatColor(v: number, scaleMax: number) {
    const a = scaleMax === 0 ? 0 : Math.min(1, Math.abs(v) / scaleMax);
    if (Math.abs(v) < 1e-9) return 'transparent';
    return v > 0
      ? `color-mix(in oklab, #22d3ee ${Math.round(14 + a * 74)}%, transparent)`
      : `color-mix(in oklab, #f66358 ${Math.round(14 + a * 74)}%, transparent)`;
  }

  function renderGrid() {
    cellEls.forEach((c, i) => {
      const on = values[i] === 1;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    });
  }

  function renderKernel() {
    const k = KERNELS[presetSel.value];
    Array.from(kernelEl.children).forEach((c, i) => {
      const v = k[i];
      (c as HTMLElement).textContent = String(v);
      (c as HTMLElement).style.background = heatColor(v, 8);
    });
  }

  function renderViz() {
    const out = outputs.get('viz');
    vizEl.replaceChildren();
    if (!out) return;
    const { max, min } = stats(out);
    const m = Math.max(Math.abs(max), Math.abs(min));
    vizEl.style.gridTemplateColumns = `repeat(${out.w}, 1fr)`;
    out.data.forEach((v) => {
      const s = document.createElement('span');
      s.style.background = heatColor(v, m) === 'transparent' ? '' : heatColor(v, m);
      vizEl.append(s);
    });
  }

  function matrix(t: T2, m: number, compare?: T2) {
    const el = document.createElement('div');
    el.className = 'mat';
    el.style.gridTemplateColumns = `repeat(${t.w}, 1fr)`;
    t.data.forEach((v, i) => {
      const s = document.createElement('span');
      s.textContent = fmt(v);
      const bg = heatColor(v, m);
      if (bg !== 'transparent') s.style.background = bg;
      if (compare && compare.h === t.h && Math.abs(compare.data[i] - v) > 1e-6) s.classList.add('is-changed');
      el.append(s);
    });
    return el;
  }

  function block(label: string, t: T2, m: number, compare?: T2) {
    const wrap = document.createElement('section');
    wrap.className = 'insp';
    const st = stats(t);
    const head = document.createElement('div');
    head.className = 'insp__head';
    head.innerHTML = `<span class="insp__label">${label}</span><code>${S.shape} [1, 1, ${t.h}, ${t.w}]</code>`;
    const foot = document.createElement('div');
    foot.className = 'insp__stats';
    foot.innerHTML = `<span>${S.min} <b>${fmt(st.min)}</b></span><span>${S.max} <b>${fmt(st.max)}</b></span><span>${S.mean} <b>${fmt(st.mean)}</b></span>`;
    wrap.append(head, matrix(t, m, compare), foot);
    return wrap;
  }

  function renderInspector() {
    Object.values(nodeEls).forEach((el) => el.classList.toggle('is-selected', el.dataset.node === selected));
    if (!selected || selected === 'start') return;
    const out = outputs.get(selected);
    if (!out) {
      inspector.innerHTML = `<p class="inspector__empty">${S.pickNode}</p>`;
      return;
    }
    const up = upstream[selected];
    const inp = up ? outputs.get(up) : undefined;
    const ms = [out, inp].filter(Boolean).map((t) => stats(t!));
    const m = Math.max(...ms.map((s) => Math.max(Math.abs(s.min), Math.abs(s.max))));
    const title = document.createElement('div');
    title.className = 'insp__title';
    const name = nodeEls[selected].querySelector('.gnode__name')!.textContent;
    title.innerHTML = `<i style="background:${getComputedStyle(nodeEls[selected]).getPropertyValue('--cat')}"></i>${name}`;
    const parts: HTMLElement[] = [title];
    if (inp) parts.push(block(S.input, inp, m));
    parts.push(block(S.output, out, m, inp));
    if (inp && inp.h === out.h) {
      const note = document.createElement('p');
      note.className = 'insp__note';
      note.textContent = S.changed;
      parts.push(note);
    }
    inspector.replaceChildren(...parts);
  }

  function select(id: NodeId) {
    if (id === 'start') return;
    selected = id;
    renderInspector();
  }

  function setStatus(kind: 'idle' | 'running' | 'done', text: string) {
    status.dataset.state = kind;
    status.querySelector('span')!.textContent = text;
  }

  // ---------------------------------------------------------------- run
  async function run(animated = true) {
    if (running) return;
    const todo = ORDER.filter((n) => dirty.has(n));
    if (!todo.length) return;
    running = true;
    const partial = hasRun && todo.length < ORDER.length;
    runBtn.disabled = true;
    root.dataset.running = 'true';
    setStatus('running', S.running);
    let computeMs = 0;
    if (!partial && animated) {
      nodeEls.start.classList.add('is-running');
      await wait(160);
      nodeEls.start.classList.remove('is-running');
      pulse('start');
      await wait(260);
    }
    for (const id of todo) {
      const el = nodeEls[id];
      el.classList.remove('is-done', 'is-stale');
      el.classList.add('is-running');
      if (animated) await wait(partial ? 110 : 220);
      const t0 = performance.now();
      outputs.set(id, compute[id as Exclude<NodeId, 'start'>]());
      computeMs += performance.now() - t0;
      dirty.delete(id);
      el.classList.remove('is-running');
      el.classList.add('is-done');
      if (id === 'viz') renderViz();
      if (selected === id || (selected && upstream[selected] === id)) renderInspector();
      if (id !== 'viz') {
        pulse(id);
        if (animated) await wait(partial ? 150 : 300);
      }
    }
    const ms = computeMs < 0.1 ? computeMs.toFixed(3) : computeMs.toFixed(2);
    setStatus(
      'done',
      partial
        ? (todo.length === 1 ? S.reran[0] : S.reran[1]).replace('{n}', String(todo.length)).replace('{ms}', ms)
        : S.done.replace('{ms}', ms),
    );
    if (!selected) select('conv');
    else renderInspector();
    hasRun = true;
    running = false;
    runBtn.disabled = false;
    root.dataset.running = 'false';
    if (dirty.size) scheduleRerun();
  }

  let rerunTimer = 0;
  function scheduleRerun() {
    if (!hasRun) return;
    clearTimeout(rerunTimer);
    rerunTimer = window.setTimeout(() => run(true), 380);
  }

  // ---------------------------------------------------------------- input
  runBtn.addEventListener('click', () => {
    clearTimeout(rerunTimer);
    ORDER.forEach((n) => dirty.add(n));
    hasRun = false;
    run(true);
  });

  presetSel.addEventListener('change', () => {
    renderKernel();
    markDirty('conv');
    scheduleRerun();
  });
  actSel.addEventListener('change', () => {
    markDirty('act');
    scheduleRerun();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) =>
    b.addEventListener('click', () => {
      values = pattern(b.dataset.preset!);
      renderGrid();
      markDirty('input');
      scheduleRerun();
    }),
  );

  // Paint on the grid: the first cell decides whether the stroke draws or erases.
  let paint: number | null = null;
  const setCell = (i: number, v: number) => {
    if (values[i] === v) return;
    values = values.slice();
    values[i] = v;
    renderGrid();
    markDirty('input');
  };
  gridEl.addEventListener('pointerdown', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (!cell) return;
    e.preventDefault();
    const i = Number(cell.dataset.cell);
    paint = values[i] ? 0 : 1;
    setCell(i, paint);
    gridEl.setPointerCapture(e.pointerId);
  });
  gridEl.addEventListener('pointermove', (e) => {
    if (paint === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const cell = el?.closest<HTMLElement>('[data-cell]');
    if (cell && gridEl.contains(cell)) setCell(Number(cell.dataset.cell), paint);
  });
  const endPaint = () => {
    if (paint === null) return;
    paint = null;
    scheduleRerun();
  };
  gridEl.addEventListener('pointerup', endPaint);
  gridEl.addEventListener('pointercancel', endPaint);
  gridEl.addEventListener('click', (e) => e.stopPropagation());

  // Keyboard: roving tabindex across the 8×8 grid.
  gridEl.addEventListener('keydown', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cell]');
    if (!cell) return;
    const i = Number(cell.dataset.cell);
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 };
    if (e.key in moves) {
      e.preventDefault();
      const j = i + moves[e.key];
      if (j < 0 || j > 63 || (Math.abs(moves[e.key]) === 1 && Math.floor(j / 8) !== Math.floor(i / 8))) return;
      cell.tabIndex = -1;
      cellEls[j].tabIndex = 0;
      cellEls[j].focus();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      setCell(i, values[i] ? 0 : 1);
      scheduleRerun();
    }
  });

  // Select a node to inspect it; drag it by its header.
  (Object.keys(nodeEls) as NodeId[]).forEach((id) => {
    const el = nodeEls[id];
    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (el.dataset.dragged === '1') {
        el.dataset.dragged = '';
        return;
      }
      if (!target.closest('[data-inspect]') && target.closest('select, button, [data-grid]')) return;
      select(id);
    });
    el.addEventListener('keydown', (e) => {
      if (e.target !== el) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(id);
      }
    });
    const handle = el.querySelector<HTMLElement>('[data-handle]');
    if (!handle) return;
    let start: { px: number; py: number; x: number; y: number } | null = null;
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      start = { px: e.clientX, py: e.clientY, x: pos[id].x, y: pos[id].y };
      el.style.zIndex = String(++topZ); // the node in hand sits above the others
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = (e.clientX - start.px) / scale;
      const dy = (e.clientY - start.py) / scale;
      if (Math.hypot(dx, dy) > 3) {
        el.dataset.dragged = '1';
        el.classList.add('is-dragging');
      }
      // Free movement: left/top stop at the canvas edge, right at its width, downward the canvas grows.
      pos[id] = {
        x: Math.max(0, Math.min(avail / scale - el.offsetWidth, start.x + dx)),
        y: Math.max(0, start.y + dy),
      };
      el.style.transform = `translate(${pos[id].x}px, ${pos[id].y}px)`;
      fitWorld();
    });
    const end = () => {
      start = null;
      el.classList.remove('is-dragging');
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  });

  // ---------------------------------------------------------------- boot
  renderGrid();
  renderKernel();
  applyLayout();
  new ResizeObserver(() => applyLayout()).observe(canvas);
  window.addEventListener("resize", () => applyLayout());
  document.fonts?.ready.then(() => drawWires());
  root.classList.add('is-ready');

  // The page's one orchestrated moment: the graph runs itself once it is seen.
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        setTimeout(() => run(!reduced()), reduced() ? 0 : 900);
      }
    },
    { threshold: 0.35 },
  );
  io.observe(canvas);
}
