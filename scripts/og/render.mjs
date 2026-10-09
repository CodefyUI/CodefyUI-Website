import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const tpl = readFileSync(new URL('./card.html', import.meta.url), 'utf8');
const digit = '........ .######. ......#. .....#.. ....#... ...#.... ...#.... ........'.replace(/ /g, '');
const grid = [...digit].map((c) => `<span${c === '#' ? ' class="on"' : ''}></span>`).join('');
const vizv = [1, .8, .85, .9, 0, 0, .9, .8, 0, .85, .7, 0, 0, 1, 0, 0];
const viz = vizv.map((v) => `<span style="${v ? `background:color-mix(in oklab,#22d3ee ${Math.round(30 + v * 60)}%,transparent)` : ''}"></span>`).join('');
const cards = [
  { out: 'public/og.png', lang: 'en', title: '<span>Deep learning</span><span>you can see inside.</span>', foot: 'Open-source, node-based deep learning · codefyui.com', fs: '84px' },
  { out: 'public/og-zh.png', lang: 'zh', title: '<span>看得見內部的</span><span>深度學習。</span>', foot: '開源的節點式深度學習建構工具 · codefyui.com', fs: '88px' },
];
const b = await chromium.launch();
for (const c of cards) {
  const html = tpl.replace('__LANG__', c.lang).replace('__TITLE__', c.title).replace('__FOOT__', c.foot).replace('__GRID__', grid).replace('__VIZ__', viz).replace('var(--fs,92px)', c.fs);
  const f = new URL(`./_${c.lang}.html`, import.meta.url);
  writeFileSync(f, html);
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(f.href); await p.waitForTimeout(400);
  await p.screenshot({ path: c.out });
  await p.close();
}
// icons
const icon = `<html><body style="margin:0;background:#0f1319;display:grid;place-items:center;width:100vw;height:100vh"><svg viewBox="0 0 32 32" style="width:62%;height:62%"><path d="M13 9h1.5a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2H19" stroke="#40a445" stroke-width="2" fill="none"/><rect x="2" y="4" width="11" height="10" rx="2.5" fill="#22d3ee"/><rect x="19" y="18" width="11" height="10" rx="2.5" fill="#f0f4f8"/></svg></body></html>`;
for (const [n, out] of [[180, 'public/apple-touch-icon.png'], [192, 'public/icon-192.png'], [512, 'public/icon-512.png']]) {
  const p = await b.newPage({ viewport: { width: n, height: n } });
  await p.setContent(icon); await p.screenshot({ path: out }); await p.close();
}
await b.close();
