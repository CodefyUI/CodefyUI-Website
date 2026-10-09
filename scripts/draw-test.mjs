import { chromium } from 'playwright';
const b = await chromium.launch();
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844, hasTouch: true, isMobile: true }]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await p.locator('[data-grid]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(3500);
  const before = await p.$$eval('.grid__cell.is-on', (c) => c.length);
  const a = await (await p.$('[data-cell="48"]')).boundingBox();
  const z = await (await p.$('[data-cell="55"]')).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  await p.mouse.move(z.x + z.width / 2, z.y + z.height / 2, { steps: 12 }); await p.mouse.up();
  await p.waitForTimeout(2500);
  const after = await p.$$eval('.grid__cell.is-on', (c) => c.length);
  console.log(vp.width, 'cells before', before, 'after', after, 'status', await p.textContent('[data-status] span'));
  await ctx.close();
}
await b.close();
