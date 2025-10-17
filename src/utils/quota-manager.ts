/**
 * Quota tracking and management utilities
 */

import type { QuotaInfo, LanguageModel } from '../types';
import { QuotaExceededError } from '../types';

export class QuotaTracker {
  constructor(private session: LanguageModel) {}

  getQuotaInfo(): QuotaInfo {
    const maxTokens = this.session.maxTokens;
    const tokensUsed = this.session.tokensSoFar;
    const tokensRemaining = this.session.tokensLeft;

    return {
      maxTokens,
      tokensUsed,
      tokensRemaining,
      percentageUsed: (tokensUsed / maxTokens) * 100,
    };
  }

  hasAvailableQuota(minimumTokens = 100): boolean {
    return this.session.tokensLeft >= minimumTokens;
  }

  getQuotaWarningLevel(): 'safe' | 'warning' | 'critical' | 'exhausted' {
    const info = this.getQuotaInfo();

    if (info.percentageUsed >= 100) {
      return 'exhausted';
    }

    if (info.percentageUsed >= 90) {
      return 'critical';
    }

    if (info.percentageUsed >= 70) {
      return 'warning';
    }

    return 'safe';
  }

  shouldWarnUser(): boolean {
    const level = this.getQuotaWarningLevel();
    return level === 'warning' || level === 'critical';
  }

  throwIfExhausted(): void {
    if (this.getQuotaWarningLevel() === 'exhausted') {
      throw new QuotaExceededError(
        'Session quota exhausted. Please create a new session or clone the current one.'
      );
    }
  }

  getCleanupSuggestion(): string {
    const level = this.getQuotaWarningLevel();
    const info = this.getQuotaInfo();

    switch (level) {
      case 'exhausted':
        return 'Quota fully exhausted. Create a new session immediately.';
      case 'critical':
        return `Only ${info.tokensRemaining} tokens remaining. Consider cloning the session soon.`;
      case 'warning':
        return `${info.percentageUsed.toFixed(1)}% of quota used. Plan to refresh the session.`;
      default:
        return 'Quota usage is healthy.';
    }
  }

  async estimatePromptCost(prompt: string): Promise<number> {
    try {
      return await this.session.countPromptTokens(prompt);
    } catch (error) {
      // Fallback estimation (rough approximation: ~4 chars per token)
      return Math.ceil(prompt.length / 4);
    }
  }

  async canAffordPrompt(prompt: string): Promise<boolean> {
    const estimatedCost = await this.estimatePromptCost(prompt);
    return this.session.tokensLeft >= estimatedCost;
  }
}

export function calculateRemainingMessages(
  quotaInfo: QuotaInfo,
  averageMessageLength = 500
): number {
  // Rough estimation: ~4 chars per token, accounting for both input and output
  const estimatedTokensPerMessage = Math.ceil((averageMessageLength * 2) / 4);
  return Math.floor(quotaInfo.tokensRemaining / estimatedTokensPerMessage);
}

export function formatQuotaInfo(info: QuotaInfo): string {
  return `Quota: ${info.tokensUsed}/${info.maxTokens} tokens used (${info.percentageUsed.toFixed(1)}%)`;
}

