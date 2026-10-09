// Repository facts read from GitHub at build time: the latest CodefyUI release
// and the star count. A failed request (offline build, rate limit) falls back
// to the last known tag and hides the count. CI rebuilds daily to keep both fresh.
const REPO = 'https://api.github.com/repos/CodefyUI/CodefyUI';
const FALLBACK = { tag: '2.8.9', url: 'https://github.com/CodefyUI/CodefyUI/releases/tag/2.8.9' };

async function gh<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(REPO + path, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'codefyui-website',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

let cachedRelease: Promise<{ tag: string; url: string }> | undefined;
export function release() {
  cachedRelease ??= gh<{ tag_name?: string; html_url?: string }>('/releases/latest').then((j) =>
    j?.tag_name && j.html_url ? { tag: j.tag_name, url: j.html_url } : FALLBACK,
  );
  return cachedRelease;
}

let cachedStars: Promise<number | null> | undefined;
export function stars() {
  cachedStars ??= gh<{ stargazers_count?: number }>('').then((j) => j?.stargazers_count ?? null);
  return cachedStars;
}
