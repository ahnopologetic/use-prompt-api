/**
 * Main React hook for Prompt API integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionOptions, QuotaInfo, AvailabilityStatus } from '../types';
import { SessionManager } from '../core/session-manager';
import { checkPromptAPIAvailability } from '../utils/availability';

export interface UsePromptAPIOptions extends SessionOptions {
  autoInitialize?: boolean;
  onDownloadProgress?: (loaded: number, total: number) => void;
}

export interface UsePromptAPIReturn {
  prompt: (input: string, signal?: AbortSignal) => Promise<string>;
  promptStreaming: (input: string, signal?: AbortSignal) => ReadableStream<string>;
  session: SessionManager | null;
  loading: boolean;
  error: Error | null;
  quota: QuotaInfo | null;
  ready: boolean;
  availability: AvailabilityStatus | null;
  initialize: () => Promise<void>;
  destroy: () => void;
  clone: () => Promise<SessionManager | null>;
}

export function usePromptAPI(options: UsePromptAPIOptions = {}): UsePromptAPIReturn {
  const { autoInitialize = true, onDownloadProgress, ...sessionOptions } = options;

  const [session, setSession] = useState<SessionManager | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null);

  const sessionRef = useRef<SessionManager | null>(null);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check availability
      const status = await checkPromptAPIAvailability();
      setAvailability(status);

      if (status === 'unavailable') {
        throw new Error('Prompt API is not available in this browser');
      }

      // Create session
      const manager = new SessionManager(sessionOptions.sessionId, {
        enablePersistence: sessionOptions.enablePersistence,
      });

      await manager.create(sessionOptions);

      sessionRef.current = manager;
      setSession(manager);
      setReady(true);

      // Update quota
      const quotaTracker = manager.getQuotaTracker();
      setQuota(quotaTracker.getQuotaInfo());
    } catch (err) {
      setError(err as Error);
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, [sessionOptions]);

  const prompt = useCallback(
    async (input: string, signal?: AbortSignal): Promise<string> => {
      if (!sessionRef.current) {
        throw new Error('Session not initialized. Call initialize() first.');
      }

      try {
        const result = await sessionRef.current.prompt(input, { signal });

        // Update quota
        const quotaTracker = sessionRef.current.getQuotaTracker();
        setQuota(quotaTracker.getQuotaInfo());

        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const promptStreaming = useCallback(
    (input: string, signal?: AbortSignal): ReadableStream<string> => {
      if (!sessionRef.current) {
        throw new Error('Session not initialized. Call initialize() first.');
      }

      const stream = sessionRef.current.promptStreaming(input, { signal });

      // Update quota after stream completes
      const originalStream = stream;
      const reader = originalStream.getReader();

      const newStream = new ReadableStream<string>({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Update quota
                if (sessionRef.current) {
                  const quotaTracker = sessionRef.current.getQuotaTracker();
                  setQuota(quotaTracker.getQuotaInfo());
                }
                controller.close();
                break;
              }

              controller.enqueue(value);
            }
          } catch (err) {
            setError(err as Error);
            controller.error(err);
          }
        },
      });

      return newStream;
    },
    []
  );

  const destroy = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.destroy();
      sessionRef.current = null;
      setSession(null);
      setReady(false);
      setQuota(null);
    }
  }, []);

  const clone = useCallback(async (): Promise<SessionManager | null> => {
    if (!sessionRef.current) {
      return null;
    }

    try {
      const clonedManager = await sessionRef.current.clone();
      return clonedManager;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }

    return () => {
      destroy();
    };
  }, [autoInitialize]);

  return {
    prompt,
    promptStreaming,
    session,
    loading,
    error,
    quota,
    ready,
    availability,
    initialize,
    destroy,
    clone,
  };
}

