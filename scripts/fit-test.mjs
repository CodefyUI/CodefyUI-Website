import { chromium } from 'playwright';
const b = await chromium.launch();
for (const path of ['/', '/zh-TW/']) for (const [w, h] of [[1280, 720], [1366, 768], [1440, 810], [1536, 864], [1710, 895], [1920, 1080], [2560, 1440]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => [...document.querySelectorAll('.screen')].map((s) => {
    const id = s.id || 'hero';
    return s.offsetHeight > innerHeight + 2 && !s.classList.contains('screen--end') ? `${id}:${s.offsetHeight}` : null;
  }).filter(Boolean));
  console.log(path, `${w}x${h}`, r.length ? 'TOO TALL ' + r.join(' ') : 'all fit');
  await p.close();
}
await b.close();
