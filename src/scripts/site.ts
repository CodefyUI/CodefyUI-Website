import Lenis from 'lenis';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

// ---------------------------------------------------------------- load
requestAnimationFrame(() => $('[data-hero]')?.classList.add('is-loaded'));

// ---------------------------------------------------------------- smooth scroll
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, anchors: { offset: -80 } });
  const raf = (t: number) => {
    lenis!.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

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
  nav.classList.remove('is-open');
  menu?.setAttribute('aria-expanded', 'false');
  lenis?.start();
};
menu?.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
  if (open) lenis?.stop();
  else lenis?.start();
});
$$('.nav__links a').forEach((a) => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    closeMenu();
    menu?.focus();
  }
});

// Current-section indicator in the nav.
const sectionLinks = $$<HTMLAnchorElement>('[data-navlink^="#"]');
const sectionObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      sectionLinks.forEach((a) => a.setAttribute('aria-current', String(a.dataset.navlink === `#${e.target.id}`)));
    });
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
sectionLinks.forEach((a) => {
  const s = document.getElementById(a.dataset.navlink!.slice(1));
  if (s) sectionObs.observe(s);
});

// ---------------------------------------------------------------- GitHub stars
(async () => {
  const el = $('[data-stars]');
  if (!el) return;
  try {
    let n = sessionStorage.getItem('cdui-stars');
    if (!n) {
      const r = await fetch('https://api.github.com/repos/CodefyUI/CodefyUI');
      if (!r.ok) return;
      n = String((await r.json()).stargazers_count ?? '');
      sessionStorage.setItem('cdui-stars', n);
    }
    if (n && Number(n) > 0) el.textContent = Number(n).toLocaleString();
  } catch {
    /* offline or rate-limited: the link still works without a count */
  }
})();

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

// ---------------------------------------------------------------- editor tour
(() => {
  const frame = $('[data-editor-frame]');
  const steps = $$('[data-step]');
  if (!frame || !steps.length) return;
  const spots = $$('[data-spot]', frame);
  const zoom = $('[data-zoom]', frame);
  const focus = (i: number) => {
    if (!zoom) return;
    if (i < 0) {
      zoom.style.transform = '';
      zoom.style.setProperty('--s', '1');
      return;
    }
    const sp = spots[i].dataset;
    const z = Number(sp.z);
    const clamp = (v: number) => Math.min(0, Math.max(100 - 100 * z, v));
    const tx = clamp(50 - z * Number(sp.fx));
    const ty = clamp(50 - z * Number(sp.fy));
    zoom.style.transform = `translate(${tx}%, ${ty}%) scale(${z})`;
    zoom.style.setProperty('--s', String(z));
  };
  let active = -1;
  let timer = 0;
  let paused = false;
  let visible = false;
  const set = (i: number) => {
    active = i;
    steps.forEach((s, j) => {
      s.classList.toggle('is-active', j === i);
      s.querySelector('button')!.setAttribute('aria-pressed', String(j === i));
    });
    spots.forEach((s, j) => s.classList.toggle('is-active', j === i));
    focus(i);
  };
  const tick = () => {
    clearTimeout(timer);
    if (reduced || paused || !visible) return;
    timer = window.setTimeout(() => {
      set((active + 1) % steps.length);
      tick();
    }, 3600);
  };
  steps.forEach((s, i) => {
    s.querySelector('button')!.addEventListener('click', () => {
      paused = true;
      set(i);
      clearTimeout(timer);
    });
  });
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible && active < 0) set(0);
      tick();
    },
    { threshold: 0.4 },
  ).observe(frame);
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

// ---------------------------------------------------------------- ship: scroll-synced terminal
(() => {
  const items = $$('[data-ship-item]');
  const panes = $$('[data-pane]');
  const title = $('[data-term-title]');
  if (!items.length) return;
  const set = (i: number) => {
    items.forEach((it, j) => it.classList.toggle('is-active', j === i));
    panes.forEach((p, j) => p.classList.toggle('is-active', j === i));
    if (title) title.textContent = panes[i]?.dataset.title ?? '';
  };
  set(0);
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) set(Number((e.target as HTMLElement).dataset.shipItem));
      });
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  items.forEach((it) => obs.observe(it));
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
    if (w) el.style.fontSize = `${(100 * el.clientWidth * 0.985) / w}px`;
  };
  document.fonts?.ready.then(fit);
  new ResizeObserver(fit).observe(el);
})();
