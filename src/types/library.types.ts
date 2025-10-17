/**
 * Library-specific type definitions
 */

import type { ZodType } from 'zod';
import type { InitialPrompt, MessageRole } from './chrome-api.types';

// Session Management
export interface PromptAPIConfig {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
  initialPrompts?: InitialPrompt[];
}

export interface SessionOptions extends PromptAPIConfig {
  sessionId?: string;
  enablePersistence?: boolean;
}

export interface SessionData {
  id: string;
  initialPrompts: InitialPrompt[];
  topK: number;
  temperature: number;
  createdAt: number;
  updatedAt: number;
}

// Streaming
export interface StreamingOptions {
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
  onComplete?: (result: string) => void;
  onError?: (error: Error) => void;
}

export type RenderMode = 'word' | 'sentence' | 'chunk';

export interface StreamRenderOptions {
  mode: RenderMode;
  onUpdate: (text: string) => void;
  debounceMs?: number;
}

// Structured Output
export interface SchemaDefinition {
  type: string;
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  enum?: string[];
  description?: string;
}

export type SchemaOutput<T> = T;

export interface StructuredPromptOptions<T> {
  schema: ZodType<T> | SchemaDefinition;
  maxRetries?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
}

// Function Calling
export interface FunctionParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: FunctionParameter;
  properties?: Record<string, FunctionParameter>;
  required?: string[];
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: FunctionParameter;
  handler: (...args: unknown[]) => Promise<unknown> | unknown;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Agent Types
export type TaskStatus = 'idle' | 'running' | 'completed' | 'failed' | 'stopped';

export interface AgentStep {
  iteration: number;
  thought?: string;
  action?: FunctionCall;
  observation?: ToolResult;
  timestamp: number;
}

export interface AgentConfig {
  maxIterations: number;
  functions?: FunctionDefinition[];
  systemPrompt?: string;
  onStep?: (step: AgentStep) => void;
  stopCondition?: (steps: AgentStep[]) => boolean;
}

export interface AdvancedAgentConfig extends AgentConfig {
  planningPrompt?: string;
  reflectionPrompt?: string;
  maxReflections?: number;
  enablePlanning?: boolean;
}

export interface AgentResult {
  status: TaskStatus;
  steps: AgentStep[];
  finalAnswer?: string;
  error?: Error;
  iterations: number;
}

export interface AgentPlan {
  steps: string[];
  dependencies: Record<number, number[]>;
}

// Error Types
export class PromptAPIError extends Error {
  public override readonly cause?: unknown;
  
  constructor(
    message: string,
    public readonly code?: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'PromptAPIError';
    this.cause = cause;
  }
}

export class QuotaExceededError extends PromptAPIError {
  constructor(message: string) {
    super(message, 'QUOTA_EXCEEDED');
    this.name = 'QuotaExceededError';
  }
}

export class SessionError extends PromptAPIError {
  constructor(message: string, cause?: unknown) {
    super(message, 'SESSION_ERROR', cause);
    this.name = 'SessionError';
  }
}

export class StructuredOutputError extends PromptAPIError {
  constructor(message: string, cause?: unknown) {
    super(message, 'STRUCTURED_OUTPUT_ERROR', cause);
    this.name = 'StructuredOutputError';
  }
}

export class FunctionCallError extends PromptAPIError {
  constructor(message: string, cause?: unknown) {
    super(message, 'FUNCTION_CALL_ERROR', cause);
    this.name = 'FunctionCallError';
  }
}

// Utility Types
export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp?: number;
}

export interface QuotaInfo {
  maxTokens: number;
  tokensUsed: number;
  tokensRemaining: number;
  percentageUsed: number;
}

