import { describe, it, expect } from 'vitest';
import { extractUrls } from '../utils/url-extractor';

describe('extractUrls', () => {
  it('should extract URLs from text', () => {
    const text = 'Visit https://example.com and http://test.org/path';
    const urls = extractUrls(text);
    expect(urls).toContain('https://example.com');
    expect(urls).toContain('http://test.org/path');
  });

  it('should deduplicate URLs', () => {
    const text = 'https://example.com https://example.com';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(1);
  });

  it('should strip trailing punctuation', () => {
    const text = 'Click https://example.com/path.';
    const urls = extractUrls(text);
    expect(urls[0]).toBe('https://example.com/path');
  });

  it('should ignore schema/XML URLs', () => {
    const text = 'http://www.w3.org/2000/svg https://schemas.microsoft.com/test';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(0);
  });

  it('should return empty array for empty string', () => {
    expect(extractUrls('')).toEqual([]);
  });

  it('should handle URLs with query parameters', () => {
    const text = 'https://example.com/search?q=hello&page=1';
    const urls = extractUrls(text);
    expect(urls[0]).toBe('https://example.com/search?q=hello&page=1');
  });
});
