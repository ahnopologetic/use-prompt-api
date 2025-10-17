/**
 * Main entry point for use-prompt-api library
 * 
 * This library provides a comprehensive TypeScript wrapper for Chrome's built-in
 * Prompt API with advanced features including structured output, function calling,
 * and agentic workflows.
 * 
 * @example
 * ```typescript
 * import { PromptClient } from '@ahnopologetic/use-prompt-api';
 * 
 * const client = new PromptClient();
 * await client.initialize();
 * 
 * const session = await client.createSession({
 *   systemPrompt: 'You are a helpful assistant',
 *   temperature: 0.7
 * });
 * 
 * const response = await session.prompt('Hello!');
 * ```
 */

// Core API
export { SessionManager } from './core/session-manager';
export { PromptClient, getDefaultClient } from './core/prompt-client';

// Structured Output
export { generateSchema, schemaToString, createSchemaPrompt } from './structured/schema-generator';
export { promptWithStructure, promptWithStructureStreaming } from './structured/structured-prompt';
export * from './structured/zod-helpers';

// Function Calling
export {
  FunctionRegistry,
  createFunctionDefinition,
  createParameters,
  builtInFunctions,
} from './function-calling/function-registry';
export {
  executeFunctionCall,
  executeFunctionCalls,
  formatToolResult,
  formatToolResults,
} from './function-calling/function-executor';
export {
  buildFunctionSystemPrompt,
  buildFewShotExamples,
  parseFunctionCall,
  formatFunctionResult,
  createFunctionCallingPrompt,
} from './function-calling/function-prompt-builder';

// Agents
export { BasicAgent } from './agents/basic-agent';
export { AdvancedAgent } from './agents/advanced-agent';
export {
  createAgent,
  createAdvancedAgent,
  isTaskComplete,
  formatAgentHistory,
  extractFinalAnswer,
  countFunctionCalls,
  getSuccessfulSteps,
  getFailedSteps,
  hasErrors,
  StoppingConditions,
  createRetryStrategy,
} from './agents/agent-utils';

// Streaming
export { StreamProcessor, collectStream, streamToAsyncIterator } from './streaming/stream-processor';
export {
  StreamRenderer,
  createStreamRenderer,
  bufferStream,
  debounceStream,
  streamWords,
  streamSentences,
} from './streaming/stream-renderers';

// Utilities
export {
  checkPromptAPIAvailability,
  waitForModelReady,
  isFeatureAvailable,
  type WaitForModelOptions,
} from './utils/availability';
export {
  isPromptAPIAvailable,
  createError,
  getErrorMessage,
  withRetry,
  createRecoverySuggestion,
} from './utils/error-handling';
export { QuotaTracker, calculateRemainingMessages, formatQuotaInfo } from './utils/quota-manager';
export {
  SessionStorage,
  generateSessionId,
  compressHistory,
  type SessionStorageOptions,
} from './utils/session-storage';

// Type exports
export type {
  // Chrome API types
  MessageRole,
  InitialPrompt,
  LanguageModelCreateOptions,
  LanguageModel,
  LanguageModelCapabilities,
  AvailabilityStatus,
  SessionQuota,
  // Library types
  PromptAPIConfig,
  SessionOptions,
  SessionData,
  StreamingOptions,
  RenderMode,
  StreamRenderOptions,
  SchemaDefinition,
  SchemaOutput,
  StructuredPromptOptions,
  FunctionParameter,
  FunctionDefinition,
  FunctionCall,
  ToolResult,
  TaskStatus,
  AgentStep,
  AgentConfig,
  AdvancedAgentConfig,
  AgentResult,
  AgentPlan,
  ConversationMessage,
  QuotaInfo,
} from './types';

// Error exports
export {
  PromptAPIError,
  QuotaExceededError,
  SessionError,
  StructuredOutputError,
  FunctionCallError,
} from './types';

