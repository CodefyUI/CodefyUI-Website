// Latest CodefyUI release, read from GitHub at build time. A failed request
// (offline build, rate limit) falls back to the last known tag.
const FALLBACK = { tag: '2.8.9', url: 'https://github.com/CodefyUI/CodefyUI/releases/tag/2.8.9' };
let cached: Promise<{ tag: string; url: string }> | undefined;

export function release() {
  cached ??= (async () => {
    try {
      const res = await fetch('https://api.github.com/repos/CodefyUI/CodefyUI/releases/latest', {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'codefyui-website',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return FALLBACK;
      const j = (await res.json()) as { tag_name?: string; html_url?: string };
      return j.tag_name && j.html_url ? { tag: j.tag_name, url: j.html_url } : FALLBACK;
    } catch {
      return FALLBACK;
    }
  })();
  return cached;
}
