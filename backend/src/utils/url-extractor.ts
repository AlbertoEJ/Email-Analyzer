const URL_REGEX = /https?:\/\/[^\s<>"')\]},;]+/gi;

const IGNORED_DOMAINS = new Set([
  'schemas.microsoft.com',
  'www.w3.org',
  'xmlns.jcp.org',
  'schemas.xmlsoap.org',
]);

export function extractUrls(text: string): string[] {
  if (!text) return [];

  const matches = text.match(URL_REGEX) || [];

  const unique = new Set<string>();

  for (let url of matches) {
    // Clean trailing punctuation
    url = url.replace(/[.,;:!?)]+$/, '');

    try {
      const parsed = new URL(url);
      if (IGNORED_DOMAINS.has(parsed.hostname)) continue;
      unique.add(url);
    } catch {
      // Skip invalid URLs
    }
  }

  return Array.from(unique);
}
