import { describe, it, expect } from 'vitest';
import { HeaderAnalyzerService } from '../services/header-analyzer.service';

const analyzer = new HeaderAnalyzerService();

describe('HeaderAnalyzerService', () => {
  it('should detect passing SPF/DKIM/DMARC', () => {
    const authResults =
      'spf=pass (google.com) dkim=pass header.d=example.com dmarc=pass';
    const result = analyzer.analyze(authResults, {});
    expect(result.spf.status).toBe('pass');
    expect(result.dkim.status).toBe('pass');
    expect(result.dmarc.status).toBe('pass');
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it('should detect failing SPF', () => {
    const authResults = 'spf=fail dkim=pass dmarc=pass';
    const result = analyzer.analyze(authResults, {});
    expect(result.spf.status).toBe('fail');
    expect(result.score).toBeGreaterThan(0);
  });

  it('should detect missing authentication', () => {
    const result = analyzer.analyze('', {});
    expect(result.spf.status).toBe('none');
    expect(result.dkim.status).toBe('none');
    expect(result.dmarc.status).toBe('none');
    expect(result.score).toBeGreaterThan(30);
  });

  it('should detect reply-to mismatch', () => {
    const result = analyzer.analyze('spf=pass dkim=pass dmarc=pass', {
      from: 'John <john@legitimate.com>',
      'reply-to': 'attacker@evil.com',
    });
    expect(result.suspiciousIndicators).toHaveLength(1);
    expect(result.suspiciousIndicators[0]).toContain('Reply-To');
  });

  it('should detect display name spoofing', () => {
    const result = analyzer.analyze('spf=pass dkim=pass dmarc=pass', {
      from: '"admin@bank.com" <phisher@evil.com>',
    });
    expect(result.suspiciousIndicators.length).toBeGreaterThan(0);
  });

  it('should handle softfail SPF', () => {
    const result = analyzer.analyze('spf=softfail dkim=pass dmarc=pass', {});
    expect(result.spf.status).toBe('softfail');
    expect(result.score).toBeGreaterThan(0);
  });
});
