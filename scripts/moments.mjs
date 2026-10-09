import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2] ?? 'http://localhost:4321/', { waitUntil: 'networkidle' });
const at = async (sel, off, name, wait = 900) => {
  await p.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + o); }, [sel, off]);
  await p.waitForTimeout(wait);
  await p.screenshot({ path: `shots/mo-${name}.png` });
};
await at('#editor', 260, 'editor0', 1600);
for (let i = 1; i < 4; i++) { await p.click(`[data-step="${i}"] button`); await p.waitForTimeout(1400); await p.screenshot({ path: `shots/mo-editor${i}.png` }); }
await at('#nodes', 300, 'nodes');
await at('#nodes', 900, 'nodes2');
await p.click('[data-filter="llm"]'); await p.waitForTimeout(600); await p.screenshot({ path: 'shots/mo-nodes-llm.png' });
await at('[data-ship-item="1"]', -300, 'ship1');
await at('#install', 0, 'install');
await at('#open-source', 0, 'open');
await b.close();
