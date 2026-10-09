import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1710, height: 895 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.getElementById('editor').offsetTop); });
const shot = async (name) => p.screenshot({ path: `shots/tour-${name}.png` });
await p.waitForTimeout(2400); await shot('drag-mid');
await p.waitForTimeout(2000); await shot('drag-end');
await p.click('[data-step="1"] button'); await p.waitForTimeout(2300); await shot('wire-bad');
await p.waitForTimeout(3000); await shot('wire-end');
await p.click('[data-step="2"] button'); await p.waitForTimeout(5200); await shot('run-mid');
await p.waitForTimeout(4200); await shot('run-end');
await p.click('[data-step="3"] button'); await p.waitForTimeout(2600); await shot('inspect');
// autoplay: after inspect it should wrap to drag
await p.waitForTimeout(4500);
console.log('active after autoplay:', await p.$eval('.tour__step.is-active', (e) => e.dataset.step));
console.log('errors', errs);
await b.close();
