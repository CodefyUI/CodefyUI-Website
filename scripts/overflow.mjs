import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(process.argv[3] ?? 390), height: 844 } });
await p.goto(process.argv[2] ?? 'http://localhost:4321/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const vw = document.documentElement.clientWidth; const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const rc = el.getBoundingClientRect();
    if (rc.right > vw + 1 && rc.width > 0) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') continue;
      out.push(`${el.tagName}.${el.className?.baseVal ?? el.className} right=${Math.round(rc.right)} w=${Math.round(rc.width)}`);
    }
  }
  return out.slice(0, 25);
});
console.log(r.join('\n'));
await b.close();
