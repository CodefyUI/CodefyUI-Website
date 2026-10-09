# CodefyUI website

Source of [www.codefyui.com](https://www.codefyui.com), the landing site for
[CodefyUI](https://github.com/CodefyUI/CodefyUI). Documentation lives separately at
[docs.codefyui.com](https://docs.codefyui.com).

A static [Astro](https://astro.build) site in English (`/`) and Traditional Chinese (`/zh-TW/`),
deployed to GitHub Pages.

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
| `src/components/Home.astro` | All page sections; each is a `.screen`, one viewport tall on desktop |
| `src/components/EditorMock.astro`, `src/data/mock-graph.ts`, `src/scripts/editor-mock.ts`, `src/styles/mock.css` | The vector editor in the tour (HTML + SVG, sharp at any zoom) and its four step timelines |
| `src/scripts/site.ts` | Nav, tour and ship rotators, node filter, Edu-ColumnStats, copy buttons, tabs |
| `src/styles/global.css` | Tokens (the editor's own surface ladder) and all styles |
| `scripts/og/` | Renders `public/og*.png` and the app icons with Playwright (`node scripts/og/render.mjs`) |
| `scripts/shots.mjs` | Screenshots at four viewports for design review (`node scripts/shots.mjs http://localhost:4321`) |
| `scripts/fit-test.mjs` | Checks every screen fits one viewport at common 16:9 sizes, in both locales |
| `scripts/demo-test.mjs`, `scripts/draw-test.mjs`, `scripts/tour-test.mjs` | Interaction checks for the hero graph and the tour |

When the CodefyUI node list, release or install commands change, update `src/data/nodes.ts`
and the dictionaries. The latest release tag is read from GitHub at build time
(`src/data/release.ts`), falling back to the last known tag.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) publishes the site to **GitHub Pages** on every
push to `main`; pull requests only build. The repository's Pages settings use *GitHub Actions*
as the source and `www.codefyui.com` as the custom domain, and Cloudflare DNS has a DNS-only
`CNAME www → treeleaves30760.github.io`.

GitHub Pages cannot set response headers or redirect rules, so the short links `/zh`, `/docs`
and `/github` are generated as redirect pages by Astro (`redirects` in `astro.config.mjs`).
