// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.codefyui.com',
  trailingSlash: 'ignore',
  // Short links. GitHub Pages has no redirect rules, so Astro writes a tiny
  // redirect page for each of these.
  redirects: {
    '/zh': '/zh-TW/',
    '/docs': 'https://docs.codefyui.com/',
    '/github': 'https://github.com/CodefyUI/CodefyUI',
  },
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', 'zh-TW': 'zh-TW' } },
      filter: (page) => !page.includes('/404'),
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-TW'],
    routing: { prefixDefaultLocale: false },
  },
});
