/**
 * React hook for structured output prompting
 */

import { useState, useCallback } from 'react';
import type { ZodType } from 'zod';
import type { SchemaDefinition } from '../types';
import { usePromptAPI, type UsePromptAPIOptions } from './usePromptAPI';
import { promptWithStructure } from '../structured';

export interface UseStructuredPromptOptions<T> extends UsePromptAPIOptions {
  schema: ZodType<T> | SchemaDefinition;
  maxRetries?: number;
}

export interface UseStructuredPromptReturn<T> {
  prompt: (input: string, signal?: AbortSignal) => Promise<T>;
  data: T | null;
  loading: boolean;
  error: Error | null;
  ready: boolean;
  validate: (data: unknown) => T;
}

export function useStructuredPrompt<T>(
  options: UseStructuredPromptOptions<T>
): UseStructuredPromptReturn<T> {
  const { schema, maxRetries = 3, ...promptOptions } = options;

  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    ready,
  } = usePromptAPI(promptOptions);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const prompt = useCallback(
    async (input: string, signal?: AbortSignal): Promise<T> => {
      if (!session) {
        throw new Error('Session not initialized');
      }

      setLoading(true);
      setError(null);

      try {
        const result = await promptWithStructure<T>(session, input, {
          schema,
          maxRetries,
          signal,
        });

        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session, schema, maxRetries]
  );

  const validate = useCallback(
    (data: unknown): T => {
      if ('parse' in schema) {
        return (schema as ZodType<T>).parse(data);
      }

      // Basic validation for JSON schema
      return data as T;
    },
    [schema]
  );

  return {
    prompt,
    data,
    loading: sessionLoading || loading,
    error: sessionError || error,
    ready,
    validate,
  };
}

