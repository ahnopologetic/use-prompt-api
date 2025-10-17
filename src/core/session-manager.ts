/**
 * Session management for Chrome Prompt API
 */

import type {
  LanguageModel,
  SessionOptions,
  SessionData,
  PromptOptions,
} from '../types';
import { SessionError } from '../types';
import { SessionStorage, generateSessionId, compressHistory } from '../utils/session-storage';
import { QuotaTracker } from '../utils/quota-manager';

export class SessionManager {
  private session: LanguageModel | undefined;
  private sessionId: string;
  private storage: SessionStorage;
  private quotaTracker: QuotaTracker | null = null;
  private enablePersistence: boolean;

  constructor(
    sessionId?: string,
    options: { enablePersistence?: boolean } = {}
  ) {
    this.sessionId = sessionId || generateSessionId();
    this.storage = new SessionStorage();
    this.enablePersistence = options.enablePersistence ?? true;
  }

  async create(options: SessionOptions = {}): Promise<LanguageModel> {
    try {
      // Get default parameters
      const sessionOptions = {
        topK: options.topK ?? 3,
        temperature: options.temperature ?? 0.7,
        initialPrompts: options.initialPrompts ?? [],
      };

      // Add system prompt if provided
      if (options.systemPrompt) {
        sessionOptions.initialPrompts.unshift({
          role: 'system' as const,
          content: options.systemPrompt,
        });
      }

      this.session = await window?.LanguageModel?.create(sessionOptions);
      if (!this.session) {
        throw new SessionError('Failed to create session');
      }
      this.quotaTracker = new QuotaTracker(this.session);

      // Save session data if persistence is enabled
      if (this.enablePersistence) {
        this.saveSessionData({
          id: this.sessionId,
          initialPrompts: sessionOptions.initialPrompts,
          topK: sessionOptions.topK,
          temperature: sessionOptions.temperature,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return this.session;
    } catch (error) {
      throw new SessionError('Failed to create session', error);
    }
  }

  async restore(sessionId: string): Promise<LanguageModel> {
    const sessionData = this.storage.load(sessionId);

    if (!sessionData) {
      throw new SessionError(`Session ${sessionId} not found in storage`);
    }

    this.sessionId = sessionId;

    return this.create({
      topK: sessionData.topK,
      temperature: sessionData.temperature,
      initialPrompts: sessionData.initialPrompts,
    });
  }

  async clone(): Promise<SessionManager> {
    if (!this.session) {
      throw new SessionError('No active session to clone');
    }

    try {
      const clonedSession = await this.session.clone();
      const newManager = new SessionManager(undefined, {
        enablePersistence: this.enablePersistence,
      });
      newManager.session = clonedSession;
      newManager.quotaTracker = new QuotaTracker(clonedSession);

      return newManager;
    } catch (error) {
      throw new SessionError('Failed to clone session', error);
    }
  }

  async prompt(input: string, options?: PromptOptions): Promise<string> {
    if (!this.session) {
      throw new SessionError('No active session. Call create() first.');
    }

    try {
      this.quotaTracker?.throwIfExhausted();

      const result = await this.session.prompt(input, options);

      // Update session history if persistence is enabled
      if (this.enablePersistence) {
        this.updateHistory(input, result);
      }

      return result;
    } catch (error) {
      throw new SessionError('Failed to prompt session', error);
    }
  }

  promptStreaming(input: string, options?: PromptOptions): ReadableStream<string> {
    if (!this.session) {
      throw new SessionError('No active session. Call create() first.');
    }

    this.quotaTracker?.throwIfExhausted();

    return this.session.promptStreaming(input, options);
  }

  async countTokens(input: string): Promise<number> {
    if (!this.session) {
      throw new SessionError('No active session. Call create() first.');
    }

    return this.session.countPromptTokens(input);
  }

  getQuotaTracker(): QuotaTracker {
    if (!this.quotaTracker) {
      throw new SessionError('No active session');
    }
    return this.quotaTracker;
  }

  getSession(): LanguageModel | undefined {
    return this.session;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  destroy(): void {
    if (this.session) {
      this.session.destroy();
      this.session = undefined;
      this.quotaTracker = null;
    }
  }

  private saveSessionData(data: SessionData): void {
    try {
      this.storage.save(this.sessionId, data);
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }

  private updateHistory(userPrompt: string, assistantResponse: string): void {
    try {
      const sessionData = this.storage.load(this.sessionId);
      if (!sessionData) return;

      sessionData.initialPrompts.push(
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: assistantResponse }
      );

      // Compress history to avoid localStorage limits
      sessionData.initialPrompts = compressHistory(sessionData.initialPrompts, 20);
      sessionData.updatedAt = Date.now();

      this.storage.save(this.sessionId, sessionData);
    } catch (error) {
      console.warn('Failed to update session history:', error);
    }
  }
}

