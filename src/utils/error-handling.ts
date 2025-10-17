/**
 * Error handling utilities
 */

import {
  PromptAPIError,
  QuotaExceededError,
  SessionError,
  StructuredOutputError,
  FunctionCallError,
} from '../types';

export function isPromptAPIAvailable(): boolean {
  return typeof window !== 'undefined' && 'ai' in window && !!window.ai?.languageModel;
}

export function createError(
  type: 'prompt' | 'quota' | 'session' | 'structured' | 'function',
  message: string,
  cause?: unknown
): PromptAPIError {
  switch (type) {
    case 'quota':
      return new QuotaExceededError(message);
    case 'session':
      return new SessionError(message, cause);
    case 'structured':
      return new StructuredOutputError(message, cause);
    case 'function':
      return new FunctionCallError(message, cause);
    default:
      return new PromptAPIError(message, undefined, cause);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    shouldRetry = () => true,
  } = options;

  return new Promise((resolve, reject) => {
    let attempt = 0;

    const execute = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        attempt++;

        if (attempt >= maxAttempts || !shouldRetry(error)) {
          reject(error);
          return;
        }

        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        setTimeout(execute, waitTime);
      }
    };

    execute();
  });
}

export function createRecoverySuggestion(error: PromptAPIError): string {
  if (error instanceof QuotaExceededError) {
    return 'Try creating a new session or clearing old conversation history.';
  }

  if (error instanceof SessionError) {
    return 'Try reinitializing the session or checking if the API is available.';
  }

  if (error instanceof StructuredOutputError) {
    return 'Try simplifying your schema or providing more specific instructions.';
  }

  if (error instanceof FunctionCallError) {
    return 'Check your function definition and ensure parameters are correctly specified.';
  }

  return 'Please check the error details and try again.';
}

