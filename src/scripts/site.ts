import { mountMock } from './editor-mock';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

// ---------------------------------------------------------------- load
requestAnimationFrame(() => $('[data-hero]')?.classList.add('is-loaded'));

// ---------------------------------------------------------------- nav
const nav = $('[data-nav]')!;
const menu = $<HTMLButtonElement>('[data-menu]');
let lastY = window.scrollY;
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 24);
  if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > 480 && y > lastY + 2);
  if (y < lastY - 2) nav.classList.remove('is-hidden');
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  nav.classList.remove('is-open');
  menu?.setAttribute('aria-expanded', 'false');
};
menu?.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
  document.documentElement.classList.toggle('menu-open', open);
});
$$('.nav__links a').forEach((a) => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    closeMenu();
    menu?.focus();
  }
});

// Current-section indicator in the nav: the section under the middle of the viewport.
const sectionLinks = $$<HTMLAnchorElement>('[data-navlink^="#"]');
const linked = sectionLinks
  .map((a) => [a, document.getElementById(a.dataset.navlink!.slice(1))] as const)
  .filter((p): p is readonly [HTMLAnchorElement, HTMLElement] => !!p[1]);
let navFrame = 0;
const markCurrent = () => {
  navFrame = 0;
  const mid = window.innerHeight / 2;
  linked.forEach(([a, sec]) => {
    const r = sec.getBoundingClientRect();
    a.setAttribute('aria-current', String(r.top <= mid && r.bottom > mid));
  });
};
window.addEventListener('scroll', () => (navFrame ||= requestAnimationFrame(markCurrent)), { passive: true });
markCurrent();

// ---------------------------------------------------------------- copy
$$<HTMLButtonElement>('[data-copy]').forEach((b) => {
  let timer = 0;
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy!);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: b.dataset.copy! });
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    b.classList.add('is-copied');
    b.querySelector('span')!.textContent = b.dataset.done!;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      b.classList.remove('is-copied');
      b.querySelector('span')!.textContent = b.dataset.label!;
    }, 1800);
  });
});

// ---------------------------------------------------------------- tabs
$$('[data-tabs]').forEach((root) => {
  const tabs = $$<HTMLButtonElement>('[role="tab"]', root);
  const select = (tab: HTMLButtonElement) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = $(`[data-panel="${t.dataset.tab}"]`, root)!;
      panel.hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });
  if (/Win/i.test(navigator.userAgent)) select(tabs.find((t) => t.dataset.tab === 'win') ?? tabs[0]);
});

// ---------------------------------------------------------------- shared: a list that plays one item at a time
// Each item runs for a while, its bar fills, then the next one starts. It
// only runs while its section is on screen, and pauses while the pointer or
// focus is inside it.
function rotator(opts: {
  root: HTMLElement;
  items: HTMLElement[];
  onSelect: (i: number) => void;
  run?: (i: number) => Promise<boolean>; // resolves when the item has finished playing
  duration: (i: number) => number;
  hold?: number;
}) {
  const { root, items } = opts;
  let active = -1;
  let visible = false;
  let paused = false;
  let gen = 0;

  const bar = (i: number, p: number) => items[i]?.style.setProperty('--p', p.toFixed(3));

  async function play(i: number) {
    const g = ++gen;
    active = i;
    items.forEach((_, j) => bar(j, 0));
    opts.onSelect(i);
    if (reduced) {
      opts.run?.(i);
      return;
    }
    const dur = opts.duration(i);
    const t0 = performance.now();
    let elapsed = 0;
    let last = t0;
    let finished = !opts.run;
    opts.run?.(i).then((ok) => {
      if (ok) finished = true;
    });
    await new Promise<void>((res) => {
      const tick = (now: number) => {
        if (g !== gen) return res();
        if (!paused && visible) elapsed += now - last;
        last = now;
        bar(i, Math.min(1, elapsed / dur));
        if (elapsed >= dur && finished) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (g !== gen) return;
    await new Promise((r) => setTimeout(r, opts.hold ?? 0));
    if (g !== gen) return;
    if (visible && !paused) play((i + 1) % items.length);
  }

  items.forEach((it, i) => it.querySelector('button')!.addEventListener('click', () => play(i)));
  root.addEventListener('pointerenter', () => (paused = true));
  root.addEventListener('pointerleave', () => (paused = false));
  root.addEventListener('focusin', () => (paused = true));
  root.addEventListener('focusout', () => (paused = false));
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible && active < 0) play(0);
    },
    { threshold: 0.45 },
  ).observe(root);
  return { play };
}

// ---------------------------------------------------------------- editor tour
(() => {
  const section = $('#editor');
  const mockEl = $('[data-mock]');
  const steps = $$('[data-step]');
  if (!section || !mockEl || !steps.length) return;
  const mock = mountMock(mockEl);
  // rough length of each timeline in editor-mock.ts, for the progress bar
  const EST = [3900, 6300, 9200, 4800];
  rotator({
    root: section,
    items: steps,
    duration: (i) => EST[i],
    hold: 900,
    run: (i) => mock.play(i),
    onSelect: (i) =>
      steps.forEach((s, j) => {
        s.classList.toggle('is-active', j === i);
        s.querySelector('button')!.setAttribute('aria-pressed', String(j === i));
      }),
  });
})();

// ---------------------------------------------------------------- node wall
(() => {
  const wall = $('[data-wall]');
  if (!wall) return;
  const items = $$('li', wall);
  const buttons = $$<HTMLButtonElement>('[data-filter]');
  const count = $('[data-count]');
  const initial = count?.textContent ?? '';
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const f = b.dataset.filter!;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (f) wall.dataset.filter = f;
      else delete wall.dataset.filter;
      let n = 0;
      items.forEach((li) => {
        const m = !f || li.dataset.cat === f;
        li.classList.toggle('is-match', m);
        if (m) n++;
      });
      if (count) count.textContent = f ? `${b.textContent!.replace(/\d+\s*$/, '').trim()}: ${n}` : initial;
    }),
  );
})();

// ---------------------------------------------------------------- Edu-ColumnStats
(() => {
  const root = $('[data-edu]');
  if (!root) return;
  const inputs = $$<HTMLInputElement>('[data-edu-in]', root);
  const outs = $$<HTMLOutputElement>('[data-edu-out]', root);
  const f = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''));
  let prev: string[] = [];
  const compute = () => {
    const xs = inputs.map((i) => Number(i.value)).filter((v) => Number.isFinite(v) && inputs.length);
    const valid = inputs.every((i) => i.value.trim() !== '' && Number.isFinite(Number(i.value)));
    if (!valid || !xs.length) {
      outs.forEach((o) => (o.textContent = '—'));
      prev = [];
      return;
    }
    const n = xs.length;
    const sum = xs.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const dev = xs.map((x) => (x - mean) ** 2);
    const variance = dev.reduce((a, b) => a + b, 0) / n;
    const vals = [f(sum), f(mean), `[${dev.map(f).join(', ')}]`, f(variance), f(Math.sqrt(variance))];
    outs.forEach((o, i) => {
      if (o.textContent !== vals[i]) {
        o.textContent = vals[i];
        if (prev.length) {
          o.classList.remove('flash');
          void o.offsetWidth;
          o.classList.add('flash');
        }
      }
    });
    prev = vals;
  };
  inputs.forEach((i) => i.addEventListener('input', compute));
  compute();
})();

// ---------------------------------------------------------------- ship: tabs that play in turn
(() => {
  const list = $('[data-ship]');
  const items = $$('[data-ship-item]');
  const panes = $$('[data-pane]');
  const title = $('[data-term-title]');
  if (!list || !items.length) return;
  const tabs = items.map((it) => it.querySelector<HTMLButtonElement>('button')!);
  rotator({
    root: list.closest('section')!,
    items,
    duration: () => 6500,
    onSelect: (i) => {
      items.forEach((it, j) => it.classList.toggle('is-active', j === i));
      tabs.forEach((t, j) => t.setAttribute('aria-expanded', String(j === i)));
      panes.forEach((p, j) => {
        p.classList.toggle('is-active', j === i);
        p.setAttribute('aria-hidden', String(j !== i));
      });
      if (title) title.textContent = panes[i]?.dataset.title ?? '';
    },
  });
})();

// ---------------------------------------------------------------- reveal
(() => {
  const els = $$('[data-reveal]');
  if (!els.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          obs.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  els.forEach((el) => obs.observe(el));
})();

// ---------------------------------------------------------------- footer wordmark: fill the width exactly
(() => {
  const el = $('.footer__mega');
  const span = el?.querySelector('span');
  if (!el || !span) return;
  const fit = () => {
    el.style.fontSize = '100px';
    const w = span.getBoundingClientRect().width;
    if (w) el.style.fontSize = `${(100 * el.clientWidth * 0.96) / w}px`;
  };
  document.fonts?.ready.then(fit);
  new ResizeObserver(fit).observe(el);
})();
