/**
 * React hook for function calling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FunctionDefinition, FunctionCall, ToolResult } from '../types';
import { usePromptAPI, type UsePromptAPIOptions } from './usePromptAPI';
import { FunctionRegistry } from '../function-calling/function-registry';
import {
  executeFunctionCall,
  formatToolResult,
} from '../function-calling/function-executor';
import {
  createFunctionCallingPrompt,
  parseFunctionCall,
} from '../function-calling/function-prompt-builder';

export interface UseFunctionCallingOptions extends UsePromptAPIOptions {
  functions: FunctionDefinition[];
  autoExecute?: boolean;
}

export interface UseFunctionCallingReturn {
  prompt: (input: string, signal?: AbortSignal) => Promise<string>;
  executeFunction: (call: FunctionCall) => Promise<ToolResult>;
  registry: FunctionRegistry;
  results: ToolResult[];
  loading: boolean;
  error: Error | null;
  ready: boolean;
  clearResults: () => void;
}

export function useFunctionCalling(
  options: UseFunctionCallingOptions
): UseFunctionCallingReturn {
  const { functions, autoExecute = true, ...promptOptions } = options;

  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    ready,
  } = usePromptAPI(promptOptions);

  const [results, setResults] = useState<ToolResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const registryRef = useRef(new FunctionRegistry());

  // Register functions
  useEffect(() => {
    registryRef.current.clear();
    registryRef.current.registerMultiple(functions);
  }, [functions]);

  const executeFunction = useCallback(async (call: FunctionCall): Promise<ToolResult> => {
    const result = await executeFunctionCall(call, registryRef.current);
    setResults((prev) => [...prev, result]);
    return result;
  }, []);

  const prompt = useCallback(
    async (input: string, signal?: AbortSignal): Promise<string> => {
      if (!session) {
        throw new Error('Session not initialized');
      }

      setLoading(true);
      setError(null);

      try {
        // Create function-aware prompt
        const functionPrompt = createFunctionCallingPrompt(input, registryRef.current);

        // Get response
        const response = await session.prompt(functionPrompt, { signal });

        // Parse for function calls
        const parsed = parseFunctionCall(response);

        if (parsed.functionCall && autoExecute) {
          // Execute function
          const result = await executeFunction(parsed.functionCall);

          // Create follow-up prompt with result
          const followUp = `Function result: ${formatToolResult(result)}\n\nPlease provide a response to the user based on this result.`;

          const finalResponse = await session.prompt(followUp, { signal });
          return finalResponse;
        }

        return parsed.regularResponse || response;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session, autoExecute, executeFunction]
  );

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    prompt,
    executeFunction,
    registry: registryRef.current,
    results,
    loading: sessionLoading || loading,
    error: sessionError || error,
    ready,
    clearResults,
  };
}

