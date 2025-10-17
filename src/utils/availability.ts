/**
 * Availability detection and model readiness utilities
 */

import type { AvailabilityStatus } from '../types';
import { PromptAPIError } from '../types';

export async function checkPromptAPIAvailability(): Promise<AvailabilityStatus> {
  if (typeof window === 'undefined' || !window.LanguageModel) {
    return 'unavailable';
  }

  try {
    const availability = await window.LanguageModel.availability();

    if (availability === 'available') {
      return 'available';
    }

    if (availability === 'downloadable') {
      return 'downloadable';
    }

    if (availability === 'downloading') {
      return 'downloading';
    }

    return 'unavailable';
  } catch (error) {
    console.warn('Failed to check Prompt API availability:', error);
    return 'unavailable';
  }
}

export interface WaitForModelOptions {
  timeout?: number;
  signal?: AbortSignal;
}

export async function waitForModelReady(
  options: WaitForModelOptions = {}
): Promise<void> {
  const { timeout = 300000, signal } = options;

  const status = await checkPromptAPIAvailability();

  if (status === 'unavailable') {
    throw new PromptAPIError(
      'Prompt API is not available in this browser. Please use Chrome 128+ with the origin trial token.'
    );
  }

  if (status === 'available') {
    return;
  }

  // Model needs to be downloaded
  return new Promise((resolve, reject) => {
    const timeoutId = timeout
      ? setTimeout(() => {
        reject(new PromptAPIError('Model download timeout exceeded'));
      }, timeout)
      : null;

    try {
      if (signal?.aborted) {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new PromptAPIError('Model download aborted'));
        return;
      }

      const availability = checkPromptAPIAvailability();
      availability.then((status) => {
        if (status === 'available') {
          if (timeoutId) clearTimeout(timeoutId);
          resolve();
          return;
        }
      }).catch((error) => {
        reject(error);
      });

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    }

    signal?.addEventListener('abort', () => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(new PromptAPIError('Model download aborted'));
    });
  });
}

export function isFeatureAvailable(_feature: 'streaming' | 'structured'): boolean {
  // All features are available if the base API is available
  // This is a placeholder for future feature detection
  return typeof window !== 'undefined' && !!window.ai?.languageModel;
}

