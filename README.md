# CodefyUI website

Source of [www.codefyui.com](https://www.codefyui.com), the landing site for
[CodefyUI](https://github.com/CodefyUI/CodefyUI). Documentation lives separately at
[docs.codefyui.com](https://docs.codefyui.com).

A static [Astro](https://astro.build) site in English (`/`) and Traditional Chinese (`/zh-TW/`),
deployed to Cloudflare Pages.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview
```

Node 22.12 or newer.

## Layout

| Path | What it holds |
|------|---------------|
| `src/i18n/en.ts`, `src/i18n/zh.ts` | Every word on the page, one dictionary per locale (same shape) |
| `src/data/nodes.ts` | Built-in node catalogue and category colours, mirrored from the CodefyUI README and `frontend/src/styles/theme.ts` |
| `src/components/Demo.astro`, `src/scripts/graph-demo.ts`, `src/scripts/tensor.ts` | The runnable hero graph: TensorInput → Conv2dExplicit → Activation → MaxPool2d → Visualize, with partial re-execution and an Inspector |
| `src/components/Home.astro` | All page sections |
| `src/scripts/site.ts` | Nav, smooth scroll, editor tour, node filter, Edu-ColumnStats, copy buttons, tabs |
| `src/styles/global.css` | Tokens (the editor's own surface ladder) and all styles |
| `public/_headers`, `public/_redirects` | Cloudflare Pages security headers, caching and short links |
| `scripts/og/` | Renders `public/og*.png` and the app icons with Playwright (`node scripts/og/render.mjs`) |
| `scripts/shots.mjs` | Screenshots at four viewports for design review (`node scripts/shots.mjs http://localhost:4321`) |

When the CodefyUI node list, release or install commands change, update `src/data/nodes.ts`
and the dictionaries. The latest release tag is read from GitHub at build time
(`src/data/release.ts`), falling back to the last known tag.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds every push and pull request:

- **push to `main`** → production on Cloudflare Pages project `codefyui-website`, served at
  [www.codefyui.com](https://www.codefyui.com)
- **pull request** from this repository → a preview deployment; the URL appears on the PR's
  `preview` environment

The deploy job also makes sure the Pages project exists and that `www.codefyui.com` is attached
to it with a proxied CNAME to `codefyui-website.pages.dev` (`scripts/ci/ensure-domain.sh`; an
existing DNS record pointing elsewhere is left alone with a warning).

Repository secrets:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account that owns `codefyui.com` |
| `CLOUDFLARE_API_TOKEN` | A custom API token with **Account › Cloudflare Pages › Edit**, plus **Zone › Zone › Read** and **Zone › DNS › Edit** for `codefyui.com` |

Manual deploy from a laptop, if ever needed: `npx wrangler login`, then `npm run deploy`.
