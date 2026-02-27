import { describe, it, expect } from 'vitest';
import { ThreatScorerService } from '../services/threat-scorer.service';

const scorer = new ThreatScorerService();

describe('ThreatScorerService', () => {
  it('should return safe for all zero scores', () => {
    const result = scorer.calculate({
      header: 0,
      url: 0,
      content: 0,
      attachment: 0,
    });
    expect(result.totalScore).toBe(0);
    expect(result.threatLevel).toBe('safe');
  });

  it('should apply correct weights', () => {
    const result = scorer.calculate({
      header: 100,
      url: 100,
      content: 100,
      attachment: 100,
    });
    expect(result.totalScore).toBe(100);
    expect(result.threatLevel).toBe('critical');
  });

  it('should weight URLs and content more heavily', () => {
    const urlHeavy = scorer.calculate({ header: 0, url: 50, content: 0, attachment: 0 });
    const headerHeavy = scorer.calculate({ header: 50, url: 0, content: 0, attachment: 0 });
    expect(urlHeavy.totalScore).toBeGreaterThan(headerHeavy.totalScore);
  });

  it('should classify medium correctly', () => {
    const result = scorer.calculate({
      header: 50,
      url: 50,
      content: 50,
      attachment: 50,
    });
    expect(result.totalScore).toBe(50);
    expect(result.threatLevel).toBe('medium');
  });

  it('should include breakdown', () => {
    const result = scorer.calculate({
      header: 40,
      url: 60,
      content: 80,
      attachment: 20,
    });
    expect(result.breakdown.header.weight).toBe(0.2);
    expect(result.breakdown.url.weight).toBe(0.3);
    expect(result.breakdown.content.weight).toBe(0.3);
    expect(result.breakdown.attachment.weight).toBe(0.2);
    expect(result.breakdown.header.weighted).toBe(8);
    expect(result.breakdown.url.weighted).toBe(18);
    expect(result.breakdown.content.weighted).toBe(24);
    expect(result.breakdown.attachment.weighted).toBe(4);
  });

  it('should classify levels correctly', () => {
    expect(scorer.calculate({ header: 10, url: 10, content: 10, attachment: 10 }).threatLevel).toBe('safe');
    expect(scorer.calculate({ header: 30, url: 30, content: 30, attachment: 30 }).threatLevel).toBe('low');
    expect(scorer.calculate({ header: 50, url: 50, content: 50, attachment: 50 }).threatLevel).toBe('medium');
    expect(scorer.calculate({ header: 70, url: 70, content: 70, attachment: 70 }).threatLevel).toBe('high');
    expect(scorer.calculate({ header: 90, url: 90, content: 90, attachment: 90 }).threatLevel).toBe('critical');
  });
});
