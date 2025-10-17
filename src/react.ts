/**
 * React integration entry point
 * 
 * Provides React hooks for seamless integration with Chrome's Prompt API
 * 
 * @example
 * ```typescript
 * import { usePromptAPI } from '@ahnopologetic/use-prompt-api/react';
 * 
 * function ChatComponent() {
 *   const { prompt, ready, loading } = usePromptAPI({
 *     systemPrompt: 'You are a helpful assistant'
 *   });
 * 
 *   const handleSubmit = async (message: string) => {
 *     const response = await prompt(message);
 *     console.log(response);
 *   };
 * 
 *   return ready ? <Chat onSubmit={handleSubmit} /> : <Loading />;
 * }
 * ```
 */

// React hooks
export {
  usePromptAPI,
  type UsePromptAPIOptions,
  type UsePromptAPIReturn,
} from './react/usePromptAPI';

export {
  useStructuredPrompt,
  type UseStructuredPromptOptions,
  type UseStructuredPromptReturn,
} from './react/useStructuredPrompt';

export {
  useFunctionCalling,
  type UseFunctionCallingOptions,
  type UseFunctionCallingReturn,
} from './react/useFunctionCalling';

export {
  useAgent,
  useAdvancedAgent,
  type UseAgentReturn,
  type UseAdvancedAgentReturn,
} from './react/useAgent';

// React utilities
export {
  PromptAPIProvider,
  usePromptAPIContext,
  PromptAPIErrorBoundary,
  type PromptAPIProviderProps,
} from './react/react-utils';

// Re-export types needed for React hooks
export type {
  SessionOptions,
  FunctionDefinition,
  AgentConfig,
  AdvancedAgentConfig,
  AgentResult,
  AgentStep,
  TaskStatus,
  QuotaInfo,
  AvailabilityStatus,
} from './types';

