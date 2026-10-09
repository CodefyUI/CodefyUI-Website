import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
const status = () => p.textContent('[data-status] span');
console.log('initial:', await status());
// change preset -> partial rerun of conv, act, pool, viz
await p.selectOption('[data-param="preset"]', 'VerticalEdge3x3');
await p.waitForTimeout(1800);
console.log('after preset:', await status());
console.log('kernel:', await p.$$eval('[data-kernel] span', (s) => s.map((x) => x.textContent).join(',')));
// change activation
await p.selectOption('[data-param="function"]', 'sigmoid');
await p.waitForTimeout(1500);
console.log('after act:', await status());
// paint: draw on cells
const cell = await p.$('[data-cell="36"]'); const bb = await cell.boundingBox();
await p.mouse.move(bb.x + 5, bb.y + 5); await p.mouse.down(); await p.mouse.move(bb.x + 60, bb.y + 5, { steps: 5 }); await p.mouse.up();
await p.waitForTimeout(2200);
console.log('after draw:', await status(), 'on cells', await p.$$eval('.grid__cell.is-on', (c) => c.length));
// select Activation node
await p.click('[data-node="act"] .gnode__name');
await p.waitForTimeout(300);
console.log('inspector title:', await p.textContent('.insp__title'), 'blocks', await p.$$eval('.insp', (x) => x.length));
// keyboard on grid
await p.focus('[data-cell="0"]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Space');
await p.waitForTimeout(1500);
console.log('kbd toggled cell1:', await p.getAttribute('[data-cell="1"]', 'aria-pressed'));
// drag node
const h = await p.$('[data-node="viz"] .gnode__head'); const hb = await h.boundingBox();
await p.mouse.move(hb.x + 20, hb.y + 10); await p.mouse.down(); await p.mouse.move(hb.x + 20, hb.y + 90, { steps: 8 }); await p.mouse.up();
await p.waitForTimeout(300);
await p.screenshot({ path: 'shots/demo-after.png', clip: { x: 40, y: 560, width: 1360, height: 340 } });
await p.locator('[data-demo]').screenshot({ path: 'shots/demo-full.png' });
// run button
await p.click('[data-run]'); await p.waitForTimeout(400);
console.log('run state mid:', await status());
await p.waitForTimeout(2500); console.log('run state end:', await status());
console.log('errors:', errs);
await b.close();
