export interface ThreatScoreResult {
  totalScore: number;
  threatLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  breakdown: {
    header: { score: number; weight: number; weighted: number };
    url: { score: number; weight: number; weighted: number };
    content: { score: number; weight: number; weighted: number };
    attachment: { score: number; weight: number; weighted: number };
  };
}

const WEIGHTS = {
  header: 0.2,
  url: 0.3,
  content: 0.3,
  attachment: 0.2,
};

export class ThreatScorerService {
  calculate(scores: {
    header: number;
    url: number;
    content: number;
    attachment: number;
  }): ThreatScoreResult {
    const breakdown = {
      header: {
        score: scores.header,
        weight: WEIGHTS.header,
        weighted: scores.header * WEIGHTS.header,
      },
      url: {
        score: scores.url,
        weight: WEIGHTS.url,
        weighted: scores.url * WEIGHTS.url,
      },
      content: {
        score: scores.content,
        weight: WEIGHTS.content,
        weighted: scores.content * WEIGHTS.content,
      },
      attachment: {
        score: scores.attachment,
        weight: WEIGHTS.attachment,
        weighted: scores.attachment * WEIGHTS.attachment,
      },
    };

    const totalScore = Math.round(
      breakdown.header.weighted +
        breakdown.url.weighted +
        breakdown.content.weighted +
        breakdown.attachment.weighted
    );

    const threatLevel = this.getThreatLevel(totalScore);

    return { totalScore, threatLevel, breakdown };
  }

  private getThreatLevel(score: number): ThreatScoreResult['threatLevel'] {
    if (score <= 20) return 'safe';
    if (score <= 40) return 'low';
    if (score <= 60) return 'medium';
    if (score <= 80) return 'high';
    return 'critical';
  }
}

export const threatScorerService = new ThreatScorerService();
