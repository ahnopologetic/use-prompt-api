/**
 * Native Chrome Prompt API type definitions
 * Based on: https://developer.chrome.com/docs/ai/prompt-api
 */

export type MessageRole = 'system' | 'user' | 'assistant';
export type LanguageModelAvailability = "available" | "unavailable" | "downloadable" | "downloading"

export interface InitialPrompt {
  role: MessageRole;
  content: string;
}

export interface LanguageModelCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: LanguageModelMonitor) => void;
  systemPrompt?: string;
  initialPrompts?: InitialPrompt[];
  topK?: number;
  temperature?: number;
}

export interface LanguageModelMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void;
  removeEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void;
}

export interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

export interface LanguageModel {
  availability(): Promise<LanguageModelAvailability>
  create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
  prompt(input: string, options?: PromptOptions): Promise<string>;
  promptStreaming(input: string, options?: PromptOptions): ReadableStream<string>;
  countPromptTokens(input: string, options?: PromptOptions): Promise<number>;
  readonly maxTokens: number;
  readonly tokensSoFar: number;
  readonly tokensLeft: number;
  clone(): Promise<LanguageModel>;
  destroy(): void;
}

export interface PromptOptions {
  signal?: AbortSignal;
}

export interface LanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTopK?: number;
  maxTopK?: number;
  defaultTemperature?: number;
}

export interface AILanguageModelFactory {
  create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
  capabilities(): Promise<LanguageModelCapabilities>;
}

// Global AI interface
export interface WindowAI {
  languageModel?: AILanguageModelFactory;
}

declare global {
  interface Window {
    ai?: WindowAI;
    LanguageModel?: LanguageModel;
  }
}

// Session quota tracking (extended from base LanguageModel)
export interface SessionQuota {
  maxTokens: number;
  tokensSoFar: number;
  tokensLeft: number;
}

// Availability status
export type AvailabilityStatus = 'available' | 'unavailable' | 'downloadable' | 'downloading';

