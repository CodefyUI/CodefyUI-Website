// Screenshot helper for design review: node scripts/shots.mjs [url] [outdir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4321';
const out = process.argv[3] ?? 'shots';
const only = process.argv[4]; // optional: "desktop" | "mobile" | ...
mkdirSync(out, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1180, height: 800 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];
const browser = await chromium.launch();
for (const vp of viewports) {
  if (only && !only.split(',').includes(vp.name)) continue;
  for (const path of (process.env.PATHS ?? '/').split(',')) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3800);
    const tag = `${vp.name}${path.replace(/\W+/g, '-')}`;
    await page.screenshot({ path: `${out}/${tag}-fold.png` });
    // scroll through to trigger observers, then capture full page
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += vp.height / 2) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(tag, 'height', h, 'overflowX', overflow, errors.length ? 'ERRORS: ' + errors.join(' | ') : '');
    await ctx.close();
  }
}
await browser.close();
